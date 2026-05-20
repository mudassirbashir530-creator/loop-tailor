import { cleanPhoneNumber, getWhatsAppLink } from './utils';
import { toast } from 'sonner';

export const openWhatsApp = (phoneNumber: string, message: string = '', countryCode: string = '+92') => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }
  
  const cleanedNumber = cleanPhoneNumber(phoneNumber, countryCode);
  const baseLink = getWhatsAppLink(cleanedNumber);
  
  if (!baseLink) {
    toast.error("Invalid phone number format");
    return;
  }
  
  const encodedMessage = encodeURIComponent(message);
  const url = message ? `${baseLink}?text=${encodedMessage}` : baseLink;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const sendWhatsAppMessage = (phone: string, text: string) => {
  if (!phone || phone.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }
  openWhatsApp(phone, text);
};

export const sendOrderConfirmationMessage = (
  customerName: string,
  dressType: string,
  orderId: string,
  totalPrice: string,
  advancePayment: string,
  balanceDue: string,
  shopName: string,
  phone: string,
  templates: any
) => {
  if (!phone || phone.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }

  let tpl = templates?.orderConfirmation || 
    `السلام علیکم {customerName}! 🎉\n` +
    `آپ کا آرڈر کنفرم ہو گیا ہے۔\n` +
    `📋 Token: #{orderId}\n` +
    `👗 Dress: {dressType}\n` +
    `💰 Total: PKR {totalPrice}\n` +
    `✅ Paid: PKR {advancePayment}\n` +
    `🔴 Balance: PKR {balanceDue}\n` +
    `شکریہ!\n` +
    `*{shopName}*`;

  tpl = tpl
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{orderId\}/g, orderId)
    .replace(/\{dressType\}/g, dressType)
    .replace(/\{totalPrice\}/g, totalPrice)
    .replace(/\{advancePayment\}/g, advancePayment)
    .replace(/\{balanceDue\}/g, balanceDue)
    .replace(/\{shopName\}/g, shopName);

  openWhatsApp(phone, tpl);
};

export const sendOrderReadyMessage = (
  customerName: string,
  dressType: string,
  orderId: string,
  shopName: string,
  phone: string,
  templates: any
) => {
  if (!phone || phone.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }

  let tpl = templates?.readyForDelivery || 
    `السلام علیکم {customerName}! 🎉\n` +
    `آپ کا آرڈر تیار ہو چکا ہے اور وصول کرنے کے لیے دستیاب ہے۔\n` +
    `📋 Token: #{orderId}\n` +
    `👗 Dress: {dressType}\n` +
    `ہماری دکان پر تشریف لائیں۔ شکریہ!\n` +
    `*{shopName}*`;

  tpl = tpl
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{orderId\}/g, orderId)
    .replace(/\{dressType\}/g, dressType)
    .replace(/\{shopName\}/g, shopName);

  openWhatsApp(phone, tpl);
};

export const sendPaymentReminderMessage = (
  customerName: string,
  remainingAmount: string,
  shopName: string,
  phone: string,
  templates: any
) => {
  if (!phone || phone.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }

  let tpl = templates?.paymentReminder || 
    `السلام علیکم {customerName}! ✨\n` +
    `یہ آپ کے بقیہ واجب الادا چارجز کی یاددہانی ہے۔\n` +
    `🔴 Balance Due: PKR {remainingAmount}\n` +
    `مہربانی کر کے جلد ادائیگی کریں۔ شکریہ!\n` +
    `*{shopName}*`;

  tpl = tpl
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{remainingAmount\}/g, remainingAmount)
    .replace(/\{shopName\}/g, shopName);

  openWhatsApp(phone, tpl);
};

