import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, query, where, onSnapshot, getDoc, setDoc, addDoc, 
  updateDoc, doc, limit, orderBy, writeBatch, getDocs, doc as firestoreDoc, serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ChatChannel, ChatMessage } from '../types/chat';
import { Customer } from '../lib/types';
import { toast } from 'sonner';

export function useChat(activeCustomerId?: string) {
  const { user } = useAuth();
  
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Use ref to keep track of current messages and avoid stale closure inside snapshot listener
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 1. Subscribe to Channels List (Tailor's channels)
  useEffect(() => {
    if (!user) {
      setChannels([]);
      setChannelsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('shopId', '==', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelsData: ChatChannel[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          channelsData.push({
            id: docSnap.id,
            customerName: data.customerName || 'Unnamed Customer',
            customerEmail: data.customerEmail || '',
            lastMessageText: data.lastMessageText || '',
            lastMessageTime: data.lastMessageTime || Date.now(),
            unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
            unreadCountCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
            shopId: data.shopId || user.uid,
            createdAt: data.createdAt || Date.now()
          });
        }
      });
      setChannels(channelsData);
      setChannelsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
      setChannelsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Subscribe to Messages of the Active Channel/Customer
  useEffect(() => {
    if (!user || !activeCustomerId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);

    const q = query(
      collection(db, 'chats', activeCustomerId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200) // safety boundary limit to prevent denial of wallet/browser crash
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          messagesData.push({
            id: docSnap.id,
            senderId: data.senderId,
            senderRole: data.senderRole as 'tailor' | 'customer',
            text: data.text || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : (data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now()),
            read: !!data.read,
            orderId: data.orderId || undefined,
            attachments: data.attachments || undefined,
          });
        }
      });

      // Maintain optimistic messages that haven't been synced yet
      const optimisticPending = messagesRef.current.filter(
        (m) => m.metadata?.delivered === false && !messagesData.some((synced) => synced.id === m.id || synced.metadata?.temporaryId === m.id)
      );

      setMessages([...messagesData, ...optimisticPending]);
      setMessagesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeCustomerId}/messages`);
      setMessagesLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeCustomerId]);

  // 3. Get or Create a Chat Channel with support for on-demand opening
  const getOrCreateChannel = useCallback(async (customer: Customer): Promise<string | null> => {
    if (!user) return null;
    try {
      const docRef = doc(db, 'chats', customer.id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const newChannel: ChatChannel = {
          id: customer.id,
          customerName: customer.name,
          customerEmail: customer.address || '',
          lastMessageText: 'Chat thread started',
          lastMessageTime: Date.now(),
          unreadCount: 0,
          shopId: user.uid,
          createdAt: Date.now()
        };
        await setDoc(docRef, newChannel);
      }
      return customer.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${customer.id}`);
      return null;
    }
  }, [user]);

  // 4. Send Message with Optimistic Update
  const sendMessage = useCallback(async (
    text: string, 
    orderId?: string, 
    attachments?: string[]
  ) => {
    if (!user || !activeCustomerId) return;

    const tempId = `temp_${Date.now()}`;
    const nowMs = Date.now();

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: user.uid,
      senderRole: 'tailor',
      text,
      createdAt: nowMs,
      read: false,
      orderId,
      attachments,
      metadata: {
        temporaryId: tempId,
        delivered: false
      }
    };

    // Optimistically prepend/append to local state
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const channelRef = doc(db, 'chats', activeCustomerId);
      const messagesColRef = collection(db, 'chats', activeCustomerId, 'messages');

      // Add actual message to collection
      const msgDocRef = await addDoc(messagesColRef, {
        senderId: user.uid,
        senderRole: 'tailor',
        text,
        createdAt: nowMs,
        read: false,
        orderId: orderId || null,
        attachments: attachments || null,
      });

      // Update the channel parent document metadata
      await updateDoc(channelRef, {
        lastMessageText: text,
        lastMessageTime: nowMs,
      });

      // Mark local optimistic message as delivered
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: msgDocRef.id, metadata: { delivered: true } } : m))
      );
    } catch (error) {
      toast.error("Failed to send message, retrying...");
      // Remove the optimistic message on hard failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      handleFirestoreError(error, OperationType.CREATE, `chats/${activeCustomerId}/messages`);
    }
  }, [user, activeCustomerId]);

  // 5. Mark read (Tailor reads Customer's messages)
  const markAsRead = useCallback(async (channelId: string) => {
    if (!user) return;
    try {
      const channelRef = doc(db, 'chats', channelId);
      
      // Update channel unreadCount count
      await updateDoc(channelRef, {
        unreadCount: 0
      });

      // Batch update messages read: true
      const q = query(
        collection(db, 'chats', channelId, 'messages'),
        where('senderRole', '==', 'customer'),
        where('read', '==', false)
      );

      const querySnap = await getDocs(q);
      if (querySnap.size > 0) {
        const batch = writeBatch(db);
        querySnap.forEach((docSnap) => {
          batch.update(docSnap.ref, { read: true });
        });
        await batch.commit();
      }
    } catch (error) {
      console.warn("Failed to mark messages as read:", error);
    }
  }, [user]);

  // 6. Support simulating a Customer response (Pre-coded for testing and sandbox experience)
  const simulateCustomerResponse = useCallback(async (text: string) => {
    if (!user || !activeCustomerId) return;
    try {
      const nowMs = Date.now();
      const messagesColRef = collection(db, 'chats', activeCustomerId, 'messages');
      const channelRef = doc(db, 'chats', activeCustomerId);

      // Add a client response
      await addDoc(messagesColRef, {
        senderId: 'simulated_customer',
        senderRole: 'customer',
        text,
        createdAt: nowMs,
        read: false,
      });

      // Fetch the current unread count to increment
      const channelSnap = await getDoc(channelRef);
      const currentUnread = channelSnap.exists() ? (channelSnap.data().unreadCount || 0) : 0;

      // Update channel metadata
      await updateDoc(channelRef, {
        lastMessageText: text,
        lastMessageTime: nowMs,
        unreadCount: currentUnread + 1,
      });
    } catch (error) {
      console.error("Failed to simulate customer response:", error);
    }
  }, [user, activeCustomerId]);

  return {
    channels,
    channelsLoading,
    messages,
    messagesLoading,
    sendMessage,
    markAsRead,
    getOrCreateChannel,
    simulateCustomerResponse
  };
}
