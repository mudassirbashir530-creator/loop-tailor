export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters (except leading +)
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with a plus, keep it but remove the plus for the wa.me link
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    // If it starts with 0 (e.g., Pakistani local format 0333...), replace 0 with 92
    cleaned = '92' + cleaned.substring(1);
  }
  
  return cleaned;
}

export interface MessageTemplates {
  orderReady?: string;
  delivered?: string;
  paymentReminder?: string;
}

const DEFAULT_TEMPLATES = {
  orderReady: `السلام علیکم *{customerName}* صاحب! 🎉\n\nآپ کا سوٹ تیار ہو گیا ہے۔\n\n📋 *Order Details:*\n• Token: #{tokenId}\n• Dress: {dressType}\n• Shop: {shopName}\n\nبراہ کرم جلد تشریف لائیں۔\nشکریہ 🙏`,
  delivered: `شکریہ *{customerName}* صاحب! \nOrder #{tokenId} deliver ہو گیا۔ \nدوبارہ تشریف لائیں! - {shopName}`,
  paymentReminder: `*{customerName}* صاحب، \nآپ کا بقایا *PKR {balance}* ہے۔ \n- {shopName}`
};

function generateLink(phone: string, text: string) {
  const formattedPhone = formatPhone(phone);
  if (!formattedPhone) return;
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${formattedPhone}?text=${encodedText}`, '_blank');
}

export function sendWhatsAppMessage(phone: string, text: string) {
  generateLink(phone, text);
}

export function sendOrderReadyMessage(
  customerName: string, 
  dressType: string, 
  tokenId: string, 
  shopName: string, 
  phone: string,
  templates?: MessageTemplates
) {
  let text = templates?.orderReady || DEFAULT_TEMPLATES.orderReady;
  text = text
    .replace(/{customerName}/g, customerName)
    .replace(/{dressType}/g, dressType)
    .replace(/{tokenId}/g, tokenId)
    .replace(/{shopName}/g, shopName);
    
  generateLink(phone, text);
}

export function sendDeliveredMessage(
  customerName: string, 
  tokenId: string, 
  shopName: string, 
  phone: string,
  templates?: MessageTemplates
) {
  let text = templates?.delivered || DEFAULT_TEMPLATES.delivered;
  text = text
    .replace(/{customerName}/g, customerName)
    .replace(/{tokenId}/g, tokenId)
    .replace(/{shopName}/g, shopName);
    
  generateLink(phone, text);
}

export function sendPaymentReminderMessage(
  customerName: string, 
  balance: string, 
  shopName: string, 
  phone: string,
  templates?: MessageTemplates
) {
  let text = templates?.paymentReminder || DEFAULT_TEMPLATES.paymentReminder;
  text = text
    .replace(/{customerName}/g, customerName)
    .replace(/{balance}/g, balance)
    .replace(/{shopName}/g, shopName);
    
  generateLink(phone, text);
}
