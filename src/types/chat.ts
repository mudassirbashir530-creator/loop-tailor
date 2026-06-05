export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'tailor' | 'customer';
  text: string;
  createdAt: number;
  read: boolean;
  orderId?: string; // Optional contextual link to a specific order
  attachments?: string[]; // Array of image/file URLs
  metadata?: {
    temporaryId?: string; // Used to match optimistic mutations
    delivered?: boolean;
  };
}

export interface ChatChannel {
  id: string; // Typically customerUid
  customerName: string;
  customerEmail?: string;
  lastMessageText: string;
  lastMessageTime: number;
  unreadCount: number;
  unreadCountCount?: number; // fallback
  shopId: string; // Shop ID (tailor's UID)
  createdAt: number;
}
