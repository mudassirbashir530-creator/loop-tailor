import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

export interface MeasurementField {
  id: string;
  labelEn: string;
  labelUr: string;
  icon: string;
  order: number;
}

export interface MeasurementTemplate {
  id: string;
  nameEn: string;
  nameUr: string;
  unit: 'inch' | 'cm';
  gender: 'male' | 'female' | 'kids';
  fields: MeasurementField[];
  isDefault?: boolean;
}

export function useMeasurementTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'measurementTemplates'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const templateData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeasurementTemplate[];
      setTemplates(templateData.sort((a, b) => a.nameEn.localeCompare(b.nameEn)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'measurementTemplates');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTemplate = async (data: Omit<MeasurementTemplate, 'id'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'measurementTemplates'), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'measurementTemplates');
      throw error;
    }
  };

  const updateTemplate = async (id: string, data: Partial<MeasurementTemplate>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'measurementTemplates', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'measurementTemplates');
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'measurementTemplates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'measurementTemplates');
      throw error;
    }
  };

  const setDefaultTemplate = async (id: string, gender: 'male' | 'female' | 'kids') => {
    if (!user) return;
    try {
      // Find current default for this gender and remove it
      const q = query(collection(db, 'measurementTemplates'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const updates = snapshot.docs
        .filter(doc => doc.data().gender === gender && doc.data().isDefault)
        .map(docData => updateDoc(doc(db, 'measurementTemplates', docData.id), { isDefault: false }));
      
      await Promise.all(updates);

      // Set new default
      await updateDoc(doc(db, 'measurementTemplates', id), {
        isDefault: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'measurementTemplates');
      throw error;
    }
  };

  return { templates, loading, addTemplate, updateTemplate, deleteTemplate, setDefaultTemplate };
}
