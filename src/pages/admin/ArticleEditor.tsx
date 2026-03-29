import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { MediaLibrary } from './MediaLibrary';

export const ArticleEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    category: '',
    tags: '',
    language: 'en',
    metaTitle: '',
    metaDescription: '',
    seoKeywords: '',
    slug: '',
    featuredImage: '',
    imageAlt: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    try {
      const docRef = doc(db, 'articles', articleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          title: data.title || '',
          subtitle: data.subtitle || '',
          content: data.content || '',
          category: data.category || '',
          tags: data.tags?.join(', ') || '',
          language: data.language || 'en',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          seoKeywords: data.seoKeywords?.join(', ') || '',
          slug: data.slug || '',
          featuredImage: data.featuredImage || '',
          imageAlt: data.imageAlt || '',
          status: data.status || 'draft',
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `articles/${articleId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title if empty
    if (name === 'title' && !isEditing && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
    }
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true);
    try {
      const articleData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
        status,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && id) {
        await updateDoc(doc(db, 'articles', id), articleData);
      } else {
        const newId = formData.slug || Date.now().toString();
        await setDoc(doc(db, 'articles', newId), {
          ...articleData,
          createdAt: serverTimestamp(),
        });
      }
      navigate('/admin/articles');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'articles');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (url: string) => {
    setFormData(prev => ({ ...prev, featuredImage: url }));
    setShowMediaPicker(false);
  };

  if (loading) {
    return <div className="text-slate-500">Loading editor...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Select Featured Image</h2>
              <button onClick={() => setShowMediaPicker(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <MediaLibrary onSelect={handleImageSelect} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/articles')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Article' : 'New Article'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="Article Title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="A brief summary of the article"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <div className="h-96 mb-12">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  className={`h-full ${formData.language === 'ur' ? 'font-urdu text-right' : ''}`}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">SEO & Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  disabled={isEditing}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Keywords (comma separated)</label>
                <input
                  type="text"
                  name="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Publishing</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="ur">Urdu (Nastaliq/Gulzar)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="e.g. Tailoring Tips"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="fashion, tips, guide"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Featured Image</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                  title="Select from Library"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
              {formData.featuredImage && (
                <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={formData.featuredImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image ALT Text</label>
              <input
                type="text"
                name="imageAlt"
                value={formData.imageAlt}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
