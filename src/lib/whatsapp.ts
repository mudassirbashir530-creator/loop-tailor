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



