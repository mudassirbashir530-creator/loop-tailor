import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Bookmark, BookmarkCheck, X, Scissors, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { UseOrderTemplatesReturn } from '../hooks/useOrderTemplates';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface OrderTemplatesProps {
  templateHook: UseOrderTemplatesReturn;
  setOrderData: Function;
  setMeasurements: Function;
  setGender?: Function;
  currentOrderData: any;
  currentMeasurements: any;
  currentGender: string;
}

export function TemplateSelector({ templateHook, setOrderData, setMeasurements, setGender }: Omit<OrderTemplatesProps, 'currentOrderData' | 'currentMeasurements' | 'currentGender'>) {
  const { templates, loading, applyTemplate } = templateHook;
  const { t, isRTL } = useLanguage();

  if (loading) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex gap-3 px-1">
        {templates.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm font-medium whitespace-nowrap">
            <Bookmark className="h-4 w-4" />
            No templates saved yet
          </div>
        ) : (
          templates.map(template => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                onClick={() => applyTemplate(template, setOrderData, setMeasurements, setGender)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border-none bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm transition-all text-left whitespace-nowrap group"
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Scissors className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{template.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{template.dressType} • {template.price ? `$${template.price}` : 'No price'}</div>
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export function SaveTemplateButton({ templateHook, currentOrderData, currentMeasurements, currentGender }: Omit<OrderTemplatesProps, 'setOrderData' | 'setMeasurements'>) {
  const { saveTemplate, templates } = templateHook;
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      await saveTemplate({
        name: templateName,
        gender: currentGender,
        dressType: currentOrderData.dressType,
        price: Number(currentOrderData.price) || 0,
        notes: currentOrderData.notes,
        measurements: currentMeasurements
      });
      setIsOpen(false);
      setTemplateName('');
      setShowSuccess(true);
      toast.success(t('orderTemplates.templateSaved') || 'Template saved successfully');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (templates.length >= 10) return null; // Max 10 templates

  return (
    <>
      <div className="flex items-center justify-center mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="rounded-xl border-dashed border-2 border-slate-300 text-slate-500 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 font-bold"
        >
          {showSuccess ? (
            <><BookmarkCheck className={cn("h-4 w-4 text-emerald-500", isRTL ? "ml-2" : "mr-2")} /> Template Saved!</>
          ) : (
            <><Bookmark className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> Save as Template</>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-gray-100 rounded-[2rem] shadow-neu overflow-hidden"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Save Template</h3>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Name</label>
                    <Input
                      autoFocus
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="e.g. Regular Shalwar Kameez"
                      className="rounded-xl h-12"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={!templateName.trim() || saving}
                    onClick={handleSave}
                    className="w-full h-12 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Template'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
