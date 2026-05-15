import { cleanPhoneNumber, getWhatsAppLink } from './utils';

export const openWhatsApp = (phoneNumber: string, message: string = '', countryCode: string = '+92') => {
  if (!phoneNumber) return;
  const cleanedNumber = cleanPhoneNumber(phoneNumber, countryCode);
  const baseLink = getWhatsAppLink(cleanedNumber);
  
  const encodedMessage = encodeURIComponent(message);
  const url = message ? `${baseLink}?text=${encodedMessage}` : baseLink;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const sendWhatsAppMessage = (phone: string, text: string) => {
  openWhatsApp(phone, text);
};

export const sendOrderReadyMessage = (customerName: string, dressType: string, orderId: string, shopName: string, phone: string, templates: any) => {
  let tpl = templates?.readyForDelivery || `Hi {customerName}, your order #{orderId} is ready for delivery!`;
  tpl = tpl.replace(/\{customerName\}/g, customerName).replace(/\{orderId\}/g, orderId);
  openWhatsApp(phone, tpl);
};

export const sendPaymentReminderMessage = (customerName: string, remainingAmount: string, shopName: string, phone: string, templates: any) => {
  let tpl = templates?.paymentReminder || `Hi {customerName}, a friendly reminder for remaining payment of {remainingAmount}.`;
  tpl = tpl.replace(/\{customerName\}/g, customerName).replace(/\{remainingAmount\}/g, remainingAmount);
  openWhatsApp(phone, tpl);
};
