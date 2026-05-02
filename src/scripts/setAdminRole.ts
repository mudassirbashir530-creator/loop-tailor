import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ADMIN_EMAILS = ["mudassirbashir530@gmail.com", "looptailor@gmail.com"];

export async function setAdminRole() {
  for (const ADMIN_EMAIL of ADMIN_EMAILS) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', ADMIN_EMAIL));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`User ${ADMIN_EMAIL} not found!`);
      continue;
    }

    snapshot.forEach(async (userDoc) => {
      await updateDoc(doc(db, 'users', userDoc.id), {
        role: 'admin',
        isAdmin: true,
        plan: 'premium',
        subscriptionActive: true,
        trialActive: false,
        paymentStatus: 'paid'
      });
      console.log(`Admin role set for: ${userDoc.id} (${ADMIN_EMAIL})`);
    });
  }
}
