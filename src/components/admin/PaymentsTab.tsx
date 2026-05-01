import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

export default function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(data);
    });
    return () => unsub();
  }, []);

  const handleMarkPaid = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'subscriptions', payment.id), {
        status: 'paid',
        updatedAt: serverTimestamp()
      });

      if (payment.userId) {
        await updateDoc(doc(db, 'users', payment.userId), {
          paymentStatus: 'paid',
          subscriptionActive: true
        });
      }

      await setDoc(doc(collection(db, 'adminLogs')), {
        action: 'Marked Payment Paid',
        targetUser: payment.userName || payment.userEmail || 'Unknown',
        targetUserId: payment.userId || '',
        performedBy: 'admin',
        timestamp: serverTimestamp(),
        details: `Amount: Rs.${payment.amount}, Plan: ${payment.plan}`
      });

      toast.success('Payment marked as paid');

      if (payment.userPhone) {
        const phone = payment.userPhone.replace(/[^\d]/g, '');
        const text = encodeURIComponent(`Assalam u Alaikum! Your Loop Tailor ${payment.plan || 'subscription'} is now active. Thank you for your payment! 🎉`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to mark as paid');
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6">Payment Submissions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-sm text-slate-500">
              <th className="py-3 px-4 font-medium">User</th>
              <th className="py-3 px-4 font-medium">Plan</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Details</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(pay => (
              <tr key={pay.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900">{pay.userName || 'Unnamed'}</p>
                  <p className="text-xs text-slate-500">{pay.userEmail}</p>
                </td>
                <td className="py-3 px-4 text-sm">{pay.plan}</td>
                <td className="py-3 px-4 text-sm font-medium">Rs. {pay.amount}</td>
                <td className="py-3 px-4 text-sm">
                  <p className="text-xs text-slate-500">EP: {pay.easyPaisaNumber || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Txn: {pay.transactionId || 'N/A'}</p>
                </td>
                <td className="py-3 px-4 text-sm text-slate-500">{formatDate(pay.createdAt)}</td>
                <td className="py-3 px-4 text-sm">
                  {pay.status === 'paid' ? (
                    <span className="text-green-600 font-medium">Paid</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Pending</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {pay.status !== 'paid' && (
                    <button 
                      onClick={() => handleMarkPaid(pay)}
                      className="px-3 py-1.5 bg-[#22C55E] text-white hover:bg-green-600 font-medium rounded-lg text-sm"
                    >
                      Mark as Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="py-8 text-center text-slate-500">No payment records found.</div>
        )}
      </div>
    </div>
  );
}
