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
    `Dear ${customerName}, your order ${orderId} at ${shopName} is confirmed.\n` +
    `Total: PKR ${totalPrice}\n` +
    `Thank you!`;

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
    `Dear ${customerName}, your order ${orderId} is ready for pickup!\n` +
    `Please visit us at your convenience.`;

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
  orderId: string,
  shopName: string,
  phone: string,
  templates: any
) => {
  if (!phone || phone.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }

  let tpl = templates?.paymentReminder || 
    `Dear ${customerName}, your balance due for order ${orderId} is PKR ${remainingAmount}.\n` +
    `Please clear payment at pickup.`;

  tpl = tpl
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{remainingAmount\}/g, remainingAmount)
    .replace(/\{orderId\}/g, orderId)
    .replace(/\{shopName\}/g, shopName);

  openWhatsApp(phone, tpl);
};

