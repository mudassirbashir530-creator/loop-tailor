import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface OrderTemplate {
  id: string;
  name: string;
  gender: string;
  dressType: string;
  price: number;
  notes: string;
  measurements: Record<string, number>;
  createdAt: any;
}

export interface UseOrderTemplatesReturn {
  templates: OrderTemplate[];
  loading: boolean;
  saveTemplate: (data: Omit<OrderTemplate, 'id' | 'createdAt'>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  applyTemplate: (template: OrderTemplate, setOrderData: Function, setMeasurements: Function, setGender?: Function) => void;
}

export function useOrderTemplates(shopId: string | undefined): UseOrderTemplatesReturn {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    fetchTemplates();
  }, [shopId]);

  const fetchTemplates = async () => {
    try {
      const q = query(collection(db, 'orderTemplates'), where('userId', '==', shopId));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderTemplate));
      // Sort by newest
      data.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (data: Omit<OrderTemplate, 'id' | 'createdAt'>) => {
    if (!shopId) return;
    try {
      await addDoc(collection(db, 'orderTemplates'), {
        ...data,
        userId: shopId,
        createdAt: serverTimestamp()
      });
      await fetchTemplates();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orderTemplates`);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!shopId) return;
    try {
      await deleteDoc(doc(db, 'orderTemplates', id));
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orderTemplates/${id}`);
    }
  };

  const applyTemplate = (template: OrderTemplate, setOrderData: Function, setMeasurements: Function, setGender?: Function) => {
    setOrderData((prev: any) => ({
      ...prev,
      dressType: template.dressType,
      price: template.price ? template.price.toString() : '',
      notes: template.notes || ''
    }));
    if (setGender && template.gender) {
      setGender(template.gender);
    }
    if (template.measurements) {
      setMeasurements(template.measurements);
    }
  };

  return { templates, loading, saveTemplate, deleteTemplate, applyTemplate };
}
