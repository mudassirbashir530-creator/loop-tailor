export const openWhatsApp = (phoneNumber: string, message: string = '') => {
  if (!phoneNumber) return;
  // Remove all non-numeric characters
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Basic validation for Pakistani numbers, could be expanded
  if (cleanNumber.startsWith('03')) {
    cleanNumber = '92' + cleanNumber.substring(1);
  }
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
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
