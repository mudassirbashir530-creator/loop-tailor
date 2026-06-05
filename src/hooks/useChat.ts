import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, query, where, onSnapshot, getDoc, setDoc, addDoc, 
  updateDoc, doc, limit, orderBy, writeBatch, getDocs
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

  // Fallback mode state
  const [isFallbackMode, setIsFallbackMode] = useState(() => {
    return localStorage.getItem('loop_tailor_chat_use_fallback') === 'true';
  });

  // Use ref to keep track of current messages and avoid stale closure inside snapshot listener
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Local Storage Helpers
  const getLocalChannels = useCallback((): ChatChannel[] => {
    try {
      const data = localStorage.getItem('loop_tailor_chats_channels');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const saveLocalChannels = useCallback((chans: ChatChannel[]) => {
    try {
      localStorage.setItem('loop_tailor_chats_channels', JSON.stringify(chans));
    } catch (e) {}
  }, []);

  const getLocalMessages = useCallback((cid: string): ChatMessage[] => {
    try {
      const data = localStorage.getItem(`loop_tailor_chats_messages_${cid}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const saveLocalMessages = useCallback((cid: string, msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(`loop_tailor_chats_messages_${cid}`, JSON.stringify(msgs));
    } catch (e) {}
  }, []);

  const enableFallbackMode = useCallback(() => {
    if (!isFallbackMode) {
      setIsFallbackMode(true);
      localStorage.setItem('loop_tailor_chat_use_fallback', 'true');
      toast.info("Offline Chat Sandbox active (providing local storage fallback for immediate design testing)", {
        duration: 4000
      });
    }
  }, [isFallbackMode]);

  // 1. Subscribe or load Channels List (Tailor's channels)
  useEffect(() => {
    if (!user) {
      setChannels([]);
      setChannelsLoading(false);
      return;
    }

    if (isFallbackMode) {
      const localChans = getLocalChannels();
      setChannels(localChans);
      setChannelsLoading(false);

      const handleStorageUpdate = (e: StorageEvent) => {
        if (e.key === 'loop_tailor_chats_channels') {
          setChannels(getLocalChannels());
        }
      };
      window.addEventListener('storage', handleStorageUpdate);
      return () => window.removeEventListener('storage', handleStorageUpdate);
    } else {
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
        console.warn("Firestore 'chats' subscription failed, enabling local storage fallback:", error);
        enableFallbackMode();
        // Set the local copy immediately
        setChannels(getLocalChannels());
        setChannelsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, isFallbackMode, getLocalChannels, enableFallbackMode]);

  // 2. Subscribe or load Messages of the Active Channel/Customer
  useEffect(() => {
    if (!user || !activeCustomerId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);

    if (isFallbackMode) {
      const localMsgs = getLocalMessages(activeCustomerId);
      setMessages(localMsgs);
      setMessagesLoading(false);

      const handleStorageUpdate = (e: StorageEvent) => {
        if (e.key === `loop_tailor_chats_messages_${activeCustomerId}`) {
          setMessages(getLocalMessages(activeCustomerId));
        }
      };
      window.addEventListener('storage', handleStorageUpdate);
      return () => window.removeEventListener('storage', handleStorageUpdate);
    } else {
      const q = query(
        collection(db, 'chats', activeCustomerId, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(200) // safety boundary limit
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
        console.warn("Firestore 'messages' subscription failed, enabling local storage fallback:", error);
        enableFallbackMode();
        setMessages(getLocalMessages(activeCustomerId));
        setMessagesLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, activeCustomerId, isFallbackMode, getLocalMessages, enableFallbackMode]);

  // 3. Get or Create a Chat Channel supporting on-demand fallback
  const getOrCreateChannel = useCallback(async (customer: Customer): Promise<string | null> => {
    if (!user) return null;

    if (isFallbackMode) {
      const localChans = getLocalChannels();
      const existing = localChans.find(c => c.id === customer.id);
      if (!existing) {
        const newChan: ChatChannel = {
          id: customer.id,
          customerName: customer.name,
          customerEmail: customer.address || '',
          lastMessageText: 'Chat thread started',
          lastMessageTime: Date.now(),
          unreadCount: 0,
          shopId: user.uid,
          createdAt: Date.now()
        };
        const updated = [newChan, ...localChans];
        saveLocalChannels(updated);
        setChannels(updated);
      }
      return customer.id;
    }

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
      console.warn("Firestore getOrCreateChannel failed, switching to local storage fallback:", error);
      enableFallbackMode();
      
      const localChans = getLocalChannels();
      const existing = localChans.find(c => c.id === customer.id);
      if (!existing) {
        const newChan: ChatChannel = {
          id: customer.id,
          customerName: customer.name,
          customerEmail: customer.address || '',
          lastMessageText: 'Chat thread started',
          lastMessageTime: Date.now(),
          unreadCount: 0,
          shopId: user.uid,
          createdAt: Date.now()
        };
        const updated = [newChan, ...localChans];
        saveLocalChannels(updated);
        setChannels(updated);
      }
      return customer.id;
    }
  }, [user, isFallbackMode, getLocalChannels, saveLocalChannels, enableFallbackMode]);

  // 4. Send Message with fallback
  const sendMessage = useCallback(async (
    text: string, 
    orderId?: string, 
    attachments?: string[]
  ) => {
    if (!user || !activeCustomerId) return;

    const tempId = `temp_${Date.now()}`;
    const nowMs = Date.now();

    if (isFallbackMode) {
      const newMsg: ChatMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId: user.uid,
        senderRole: 'tailor',
        text,
        createdAt: nowMs,
        read: false,
        orderId,
        attachments
      };

      const msgs = getLocalMessages(activeCustomerId);
      const updatedMsgs = [...msgs, newMsg];
      saveLocalMessages(activeCustomerId, updatedMsgs);
      setMessages(updatedMsgs);

      const chans = getLocalChannels();
      const updatedChans = chans.map(c => c.id === activeCustomerId ? {
        ...c,
        lastMessageText: text,
        lastMessageTime: nowMs,
        unreadCount: 0
      } : c);
      saveLocalChannels(updatedChans);
      setChannels(updatedChans);
      return;
    }

    // Pre-create optimistic message
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

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const channelRef = doc(db, 'chats', activeCustomerId);
      const messagesColRef = collection(db, 'chats', activeCustomerId, 'messages');

      const msgDocRef = await addDoc(messagesColRef, {
        senderId: user.uid,
        senderRole: 'tailor',
        text,
        createdAt: nowMs,
        read: false,
        orderId: orderId || null,
        attachments: attachments || null,
      });

      await updateDoc(channelRef, {
        lastMessageText: text,
        lastMessageTime: nowMs,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: msgDocRef.id, metadata: { delivered: true } } : m))
      );
    } catch (error) {
      console.warn("Failed to send online message, using local fallback attempt:", error);
      enableFallbackMode();

      // Implement fallback logic for this message
      const msgs = getLocalMessages(activeCustomerId);
      const newMsg: ChatMessage = {
        id: tempId,
        senderId: user.uid,
        senderRole: 'tailor',
        text,
        createdAt: nowMs,
        read: false,
        orderId,
        attachments
      };
      const updatedMsgs: ChatMessage[] = [...msgs, newMsg];
      saveLocalMessages(activeCustomerId, updatedMsgs);
      setMessages(updatedMsgs);

      const chans = getLocalChannels();
      const updatedChans = chans.map(c => c.id === activeCustomerId ? {
        ...c,
        lastMessageText: text,
        lastMessageTime: nowMs
      } : c);
      saveLocalChannels(updatedChans);
      setChannels(updatedChans);
    }
  }, [user, activeCustomerId, isFallbackMode, getLocalMessages, saveLocalMessages, getLocalChannels, saveLocalChannels, enableFallbackMode]);

  // 5. Mark read (Tailor reads Customer's messages)
  const markAsRead = useCallback(async (channelId: string) => {
    if (!user) return;

    if (isFallbackMode) {
      const chans = getLocalChannels();
      const updatedChans = chans.map(c => c.id === channelId ? {
        ...c,
        unreadCount: 0
      } : c);
      saveLocalChannels(updatedChans);
      setChannels(updatedChans);

      const msgs = getLocalMessages(channelId);
      const updatedMsgs = msgs.map(m => m.senderRole === 'customer' ? { ...m, read: true } : m);
      saveLocalMessages(channelId, updatedMsgs);
      setMessages(updatedMsgs);
      return;
    }

    try {
      const channelRef = doc(db, 'chats', channelId);
      await updateDoc(channelRef, {
        unreadCount: 0
      });

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
  }, [user, isFallbackMode, getLocalChannels, saveLocalChannels, getLocalMessages, saveLocalMessages]);

  // 6. Simulate customer reply
  const simulateCustomerResponse = useCallback(async (text: string) => {
    if (!user || !activeCustomerId) return;

    const nowMs = Date.now();

    if (isFallbackMode) {
      const newMsg: ChatMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId: 'simulated_customer',
        senderRole: 'customer',
        text,
        createdAt: nowMs,
        read: false
      };

      const msgs = getLocalMessages(activeCustomerId);
      const updatedMsgs = [...msgs, newMsg];
      saveLocalMessages(activeCustomerId, updatedMsgs);
      setMessages(updatedMsgs);

      const chans = getLocalChannels();
      const updatedChans = chans.map(c => c.id === activeCustomerId ? {
        ...c,
        lastMessageText: text,
        lastMessageTime: nowMs,
        unreadCount: (c.unreadCount || 0) + 1
      } : c);
      saveLocalChannels(updatedChans);
      setChannels(updatedChans);
      return;
    }

    try {
      const messagesColRef = collection(db, 'chats', activeCustomerId, 'messages');
      const channelRef = doc(db, 'chats', activeCustomerId);

      await addDoc(messagesColRef, {
        senderId: 'simulated_customer',
        senderRole: 'customer',
        text,
        createdAt: nowMs,
        read: false,
      });

      const channelSnap = await getDoc(channelRef);
      const currentUnread = channelSnap.exists() ? (channelSnap.data().unreadCount || 0) : 0;

      await updateDoc(channelRef, {
        lastMessageText: text,
        lastMessageTime: nowMs,
        unreadCount: currentUnread + 1,
      });
    } catch (error) {
      console.warn("Firestore simulateCustomerResponse failed, performing fallback simulation:", error);
      enableFallbackMode();

      // Trigger fallback simulation instantly
      const newMsg: ChatMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId: 'simulated_customer',
        senderRole: 'customer',
        text,
        createdAt: nowMs,
        read: false
      };

      const msgs = getLocalMessages(activeCustomerId);
      const updatedMsgs = [...msgs, newMsg];
      saveLocalMessages(activeCustomerId, updatedMsgs);
      setMessages(updatedMsgs);

      const chans = getLocalChannels();
      const updatedChans = chans.map(c => c.id === activeCustomerId ? {
        ...c,
        lastMessageText: text,
        lastMessageTime: nowMs,
        unreadCount: (c.unreadCount || 0) + 1
      } : c);
      saveLocalChannels(updatedChans);
      setChannels(updatedChans);
    }
  }, [user, activeCustomerId, isFallbackMode, getLocalMessages, saveLocalMessages, getLocalChannels, saveLocalChannels, enableFallbackMode]);

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
