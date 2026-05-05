import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import { useMeasurementTemplates, MeasurementTemplate, MeasurementField } from '../hooks/useMeasurementTemplates';
import { Plus, Trash2, Edit2, Check, X, GripVertical, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
    <Card className="bg-white rounded-xl shadow p-4 mb-4 border-none mt-8">
      <CardHeader className="border-b border-gray-200/50 bg-transparent flex flex-row items-center justify-between pb-4 px-0 pt-0">
        <div>
          <CardTitle className="text-xl">Measurement Templates</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Custom measurement fields for different genders.</p>
        </div>
        {!newTemplateMode && !editingTemplate && (
          <Button onClick={handleStartCreate} size="sm" className="bg-brand-primary text-white">
            <Plus className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} /> New Template
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-4">
        <AnimatePresence mode="wait">
          {(newTemplateMode || editingTemplate) ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 bg-white p-6 rounded-2xl shadow-neu-inner"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Name (English)</label>
                  <Input 
                    value={formData.nameEn} 
                    onChange={e => setFormData({ ...formData, nameEn: e.target.value })} 
                    placeholder="e.g. Standard Suit"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 text-right block">نام (اردو)</label>
                  <Input 
                    value={formData.nameUr} 
                    onChange={e => setFormData({ ...formData, nameUr: e.target.value })} 
                    dir="rtl"
                    placeholder="مثال: عام سوٹ"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Gender</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Unit</label>
                  <select 
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="inch">Inches (in)</option>
                    <option value="cm">Centimeters (cm)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900">Fields</h4>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-4 w-4 mr-1" /> Add Field
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.fields.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4">No fields added yet.</p>
                  ) : (
                    formData.fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-brand-primary disabled:opacity-30">
                            <GripVertical className="h-4 w-4 rotate-90" />
                          </button>
                        </div>
                        <Input 
                          placeholder="Label (En)" 
                          value={field.labelEn} 
                          onChange={e => updateField(index, { labelEn: e.target.value })} 
                          className="flex-1"
                        />
                        <Input 
                          placeholder="لیبل (اردو)" 
                          value={field.labelUr} 
                          onChange={e => updateField(index, { labelUr: e.target.value })} 
                          dir="rtl"
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" onClick={() => { setNewTemplateMode(false); setEditingTemplate(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-brand-primary text-white">
                  Save Template
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
              {templates.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-500 font-medium">No custom measurement templates found.</p>
                  <p className="text-sm text-slate-400">The default system measurements will be used.</p>
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className={cn("p-4 rounded-2xl border transition-all", template.isDefault ? "bg-brand-primary/5 border-brand-primary/20 shadow-neu-sm" : "bg-white border-slate-100 hover:shadow-sm")}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{isRTL ? template.nameUr || template.nameEn : template.nameEn}</h4>
                          {template.isDefault && (
                            <span className="flex items-center text-[10px] uppercase tracking-wider font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Default {template.gender}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 capitalize font-medium flex items-center gap-3">
                          <span>{template.gender}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>{template.fields.length} {template.fields.length === 1 ? 'Field' : 'Fields'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="uppercase">{template.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!template.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => setAsDefault(template)} className="text-xs">
                            Make Default
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleStartEdit(template)}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
