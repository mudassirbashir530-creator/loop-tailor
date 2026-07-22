import { formatWhatsAppNumber } from './phoneFormatter';

/**
 * Builds the Order Confirmation message text.
 */
export const getOrderConfirmationMessage = (
  customerName: string,
  tokenNumber: string,
  totalPrice: string | number,
  deliveryDate: string,
  shopName: string
): string => {
  return `Assalam o Alaikum ${customerName}! 
Aapka order confirm ho gaya hai.

Order ID: ${tokenNumber}
Total Amount: PKR ${totalPrice}
Delivery Date: ${deliveryDate}

Shukriya ${shopName} choose karne ka! 🙏`;
};

/**
 * Builds the Order Ready message text.
 */
export const getOrderReadyMessage = (
  customerName: string,
  tokenNumber: string,
  deliveryType: string,
  shopName: string
): string => {
  return `Assalam o Alaikum ${customerName}!
Aapka order tayar ho gaya hai ✅

Order ID: ${tokenNumber}
Delivery Type: ${deliveryType}

${deliveryType === 'Self Pickup' 
  ? 'Please visit us to collect your order.'
  : 'Your order will be delivered soon.'}

${shopName}`;
};

/**
 * Builds the Payment Reminder message text.
 */
export const getPaymentReminderMessage = (
  customerName: string,
  tokenNumber: string,
  totalPrice: string | number,
  totalPaid: string | number,
  balanceDue: string | number,
  shopName: string
): string => {
  return `Assalam o Alaikum ${customerName},
Aapke order ka baki payment:

Order ID: ${tokenNumber}
Total:     PKR ${totalPrice}
Paid:      PKR ${totalPaid}
Balance:   PKR ${balanceDue}

Please payment clear karein.
Shukriya! ${shopName}`;
};

/**
 * Opens Web or Native WhatsApp with prefilled message
 */
export const openWhatsApp = (phone: string, message: string): void => {
  const formattedPhone = formatWhatsAppNumber(phone);
  if (!formattedPhone) {
    throw new Error('Phone number is invalid or could not be formatted.');
  }
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
