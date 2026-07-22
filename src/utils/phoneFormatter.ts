/**
 * Formats a phone number for use with WhatsApp API.
 * Ensures Pakistani standard format (923xxxxxxxxx) and general international compatibility.
 */
export const formatWhatsAppNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  // Store a string check before stripping non-digits to handle '+92' starting
  const rawString = String(phone).trim();
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Pakistani numbers starting with '0'
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  
  // Handle other edge cases
  if (rawString.startsWith('+92') && cleaned.startsWith('92') && cleaned.length === 12) {
    return cleaned;
  }
  
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return cleaned; // Valid Pakistani mobile No: 923001234567
  }
  
  // International numbers
  if (cleaned.length >= 10) {
    return cleaned;
  }
  
  return null; // Invalid number
};
