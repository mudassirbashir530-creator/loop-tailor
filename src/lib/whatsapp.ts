import { cleanPhoneNumber, getWhatsAppLink } from './utils';
import { toast } from 'sonner';

export const OFFICIAL_WHATSAPP_NUMBER = '03321379924';
export const OFFICIAL_WHATSAPP_CLEAN = '923321379924';

export const openWhatsApp = (phoneNumber: string, message: string = '', countryCode: string = '+92') => {
  const targetPhone = (!phoneNumber || phoneNumber.trim() === '') ? OFFICIAL_WHATSAPP_NUMBER : phoneNumber;
  
  const cleanedNumber = cleanPhoneNumber(targetPhone, countryCode);
  const baseLink = getWhatsAppLink(cleanedNumber);
  
  if (!baseLink) {
    toast.error("Invalid phone number format");
    return;
  }
  
  const encodedMessage = encodeURIComponent(message);
  const url = message ? `${baseLink}?text=${encodedMessage}` : baseLink;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const openAdminWhatsApp = (message: string = '') => {
  openWhatsApp(OFFICIAL_WHATSAPP_NUMBER, message, '+92');
};

export const sendWhatsAppMessage = (phone: string, text: string) => {
  if (!phone || phone.trim() === '') {
    toast.error("Please add customer phone number first");
    return;
  }
  openWhatsApp(phone, text);
};
