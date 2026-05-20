import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import { useMeasurementTemplates, MeasurementTemplate, MeasurementField } from '../hooks/useMeasurementTemplates';
import { Plus, Trash2, Edit2, Check, X, GripVertical, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function MeasurementTemplatesManager() {
  const { t, isRTL } = useLanguage();
  const { templates, addTemplate, updateTemplate, deleteTemplate, setDefaultTemplate, loading } = useMeasurementTemplates();
  const [editingTemplate, setEditingTemplate] = useState<MeasurementTemplate | null>(null);
  const [newTemplateMode, setNewTemplateMode] = useState(false);

  const [formData, setFormData] = useState<Omit<MeasurementTemplate, 'id'>>({
    nameEn: '',
    nameUr: '',
    unit: 'inch',
    gender: 'male',
    fields: [],
    isDefault: false
  });

  const handleStartCreate = () => {
    setFormData({
      nameEn: '',
      nameUr: '',
      unit: 'inch',
      gender: 'male',
      fields: [],
      isDefault: false
    });
    setNewTemplateMode(true);
    setEditingTemplate(null);
  };

  const handleStartEdit = (template: MeasurementTemplate) => {
    setFormData({
      nameEn: template.nameEn,
      nameUr: template.nameUr,
      unit: template.unit,
      gender: template.gender,
      fields: [...template.fields],
      isDefault: template.isDefault || false
    });
    setEditingTemplate(template);
    setNewTemplateMode(false);
  };

  const handleSave = async () => {
    if (!formData.nameEn) {
      toast.error('Template name (English) is required.');
      return;
    }

    try {
      if (newTemplateMode) {
        await addTemplate(formData);
        toast.success('Template created successfully.');
      } else if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
        toast.success('Template updated successfully.');
      }
      setEditingTemplate(null);
      setNewTemplateMode(false);
    } catch (error) {
      toast.error('Error saving template.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
      toast.success('Template deleted.');
    }
  };

  const setAsDefault = async (template: MeasurementTemplate) => {
    await setDefaultTemplate(template.id, template.gender);
    toast.success(`Set as default template for ${template.gender}.`);
  };

  const addField = () => {
    const newField: MeasurementField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      labelEn: '',
      labelUr: '',
      icon: 'Ruler',
      order: formData.fields.length
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const updateField = (index: number, updates: Partial<MeasurementField>) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFormData({ ...formData, fields: updatedFields });
  };

  const removeField = (index: number) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updatedFields });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updatedFields = [...formData.fields];
      [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
      // Update order values
      updatedFields.forEach((f, i) => f.order = i);
      setFormData({ ...formData, fields: updatedFields });
    } else if (direction === 'down' && index < formData.fields.length - 1) {
      const updatedFields = [...formData.fields];
      [updatedFields[index + 1], updatedFields[index]] = [updatedFields[index], updatedFields[index + 1]];
      // Update order values
      updatedFields.forEach((f, i) => f.order = i);
      setFormData({ ...formData, fields: updatedFields });
    }
  };

  if (loading) return null;

  return (
    <Card className="bg-surface rounded-3xl shadow-sm p-5 sm:p-6 border border-outline-variant mt-8">
      <CardHeader className="border-b border-outline-variant bg-transparent flex flex-row items-center justify-between pb-5 px-0 pt-0">
        <div>
          <CardTitle className="text-lg font-medium text-on-surface">Measurement Templates</CardTitle>
          <p className="text-sm text-on-surface-variant mt-1">Custom measurement fields for different genders.</p>
        </div>
        {!newTemplateMode && !editingTemplate && (
          <Button onClick={handleStartCreate} size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-soft h-9 px-4">
            <Plus className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} /> New Template
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-5">
        <AnimatePresence mode="wait">
          {(newTemplateMode || editingTemplate) ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">Name (English)</label>
                  <input
                    value={formData.nameEn} 
                    onChange={e => setFormData({ ...formData, nameEn: e.target.value })} 
                    placeholder="e.g. Standard Suit"
                    className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 text-on-surface font-medium outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider text-right block">نام (اردو)</label>
                  <input
                    value={formData.nameUr} 
                    onChange={e => setFormData({ ...formData, nameUr: e.target.value })} 
                    dir="rtl"
                    placeholder="مثال: عام سوٹ"
                    className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 text-on-surface font-medium outline-none transition-all shadow-sm font-urdu"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">Gender</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">Unit</label>
                  <select 
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                  >
                    <option value="inch">Inches (in)</option>
                    <option value="cm">Centimeters (cm)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-on-surface">Fields</h4>
                  <Button variant="outline" size="sm" onClick={addField} className="h-9 px-3 rounded-xl border-outline-variant hover:bg-surface-container">
                    <Plus className="h-4 w-4 mr-1" /> Add Field
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.fields.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic text-center py-4">No fields added yet.</p>
                  ) : (
                    formData.fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-outline-variant shadow-sm transition-colors group">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="text-on-surface-variant hover:text-primary disabled:opacity-30 p-1">
                            <GripVertical className="h-4 w-4 rotate-90" />
                          </button>
                        </div>
                        <input
                          placeholder="Label (En)" 
                          value={field.labelEn} 
                          onChange={e => updateField(index, { labelEn: e.target.value })} 
                          className="flex-1 h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary text-sm font-medium outline-none transition-all"
                        />
                        <input
                          placeholder="لیبل (اردو)" 
                          value={field.labelUr} 
                          onChange={e => updateField(index, { labelUr: e.target.value })} 
                          dir="rtl"
                          className="flex-1 h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary text-sm font-medium outline-none transition-all font-urdu"
                        />
                        <Button variant="ghost" onClick={() => removeField(index)} className="text-error hover:text-error hover:bg-error/10 h-11 w-11 p-2 flex items-center justify-center rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-outline-variant">
                <Button variant="ghost" className="rounded-xl h-10 px-4 hover:bg-surface-container text-on-surface-variant" onClick={() => { setNewTemplateMode(false); setEditingTemplate(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 shadow-soft font-medium">
                  Save Template
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
              {templates.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant flex flex-col items-center">
                  <p className="text-on-surface font-medium">No custom measurement templates found.</p>
                  <p className="text-sm text-on-surface-variant mt-1">The default system measurements will be used.</p>
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className={cn("p-4 sm:p-5 rounded-2xl border transition-all", template.isDefault ? "bg-primary/5 border-primary/20 shadow-soft" : "bg-surface-container-lowest border-outline-variant hover:shadow-sm")}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="font-semibold text-on-surface">{isRTL ? template.nameUr || template.nameEn : template.nameEn}</h4>
                          {template.isDefault && (
                            <span className="flex items-center text-[10px] uppercase tracking-widest font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Default {template.gender}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] uppercase tracking-widest text-on-surface-variant mt-2 font-semibold flex items-center gap-2">
                          <span>{template.gender}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                          <span>{template.fields.length} {template.fields.length === 1 ? 'Field' : 'Fields'}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                          <span>{template.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {!template.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => setAsDefault(template)} className="text-xs h-8 px-2 sm:px-3 rounded-lg border-outline-variant hover:bg-surface-container">
                            Make Default
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => handleStartEdit(template)} className="h-11 w-11 p-2 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleDelete(template.id)} className="text-error hover:text-error hover:bg-error/10 h-11 w-11 p-2 flex items-center justify-center rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
