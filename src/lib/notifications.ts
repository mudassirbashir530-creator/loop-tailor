import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from "sonner";

export async function createNotification(shopId: string, data: {
  title: string;
  message: string;
  type: 'order_status' | 'payment' | 'system';
  orderId?: string;
}) {
  if (!shopId) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      userId: shopId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function sendWhatsappNotification(params: {
  to: string;
  customerName: string;
  dressType: string;
  token: string;
  shopName: string;
  status: string;
  orderId: string;
  shopId: string;
}) {
  try {
    const res = await fetch("/api/notify/whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status !== 503) { // 503 means Twilio is not configured, don't show an intrusive error for that usually, but we could.
        console.warn("WhatsApp notification error:", data.error);
      }
      return { success: false, error: data.error };
    }
    
    toast.success("WhatsApp notification sent to customer");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send WhatsApp notification", err);
    return { success: false, error: err.message };
  }
}
