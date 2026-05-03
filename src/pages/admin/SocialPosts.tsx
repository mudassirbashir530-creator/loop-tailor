import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Share2, Copy, CheckCircle2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export const SocialPosts: React.FC = () => {
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<{
    facebook: string;
    instagram: string;
    linkedin: string;
    hashtags: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!content.trim()) return;
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert social media manager. I will provide you with a base content or idea.
        Generate 3 distinct, highly engaging social media posts optimized for:
        1. Facebook (Engaging, conversational, uses emojis, encourages comments)
        2. Instagram (Visual description, catchy caption, highly aesthetic tone)
        3. LinkedIn (Professional, insightful, industry-focused, clean formatting)
        
        Also provide a list of 10-15 relevant hashtags.
        
        Return the response strictly in this JSON format:
        {
          "facebook": "post content here",
          "instagram": "post content here",
          "linkedin": "post content here",
          "hashtags": "#tag1 #tag2 ..."
        }
        
        Base Content:
        ${content}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const result = JSON.parse(response.text);
      setGeneratedPosts(result);
    } catch (error) {
      console.error("Error generating posts:", error);
      toast.error("Failed to generate posts. Please check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (!generatedPosts) return;
    setSaving(true);
    try {
      const newId = Date.now().toString();
      await setDoc(doc(db, 'social_posts', newId), {
        baseContent: content,
        ...generatedPosts,
        createdAt: serverTimestamp(),
      });
      toast.success('Posts saved to database successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'social_posts');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-brand-primary" />
          Social Media Post Generator
        </h1>
        {generatedPosts && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 shadow-neu text-slate-700 rounded-xl hover:shadow-neu-pressed-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save to Database
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-gray-100 p-6 rounded-[2rem] shadow-neu border-none">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What do you want to post about?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-2xl shadow-neu-pressed-sm focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
              placeholder="E.g., We just launched a new feature that allows tailors to send automated WhatsApp reminders to customers when their order is ready..."
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !content.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm rounded-xl transition-all disabled:opacity-50 font-bold border-none"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                'Generate Posts'
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {generatedPosts ? (
            <>
              {['facebook', 'instagram', 'linkedin'].map((platform) => (
                <div key={platform} className="bg-gray-100 p-6 rounded-[2rem] shadow-neu border-none">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 capitalize">{platform}</h3>
                    <button
                      onClick={() => handleCopy(generatedPosts[platform as keyof typeof generatedPosts], platform)}
                      className="p-2 bg-gray-100 shadow-neu rounded-full text-slate-500 hover:text-brand-primary hover:shadow-neu-pressed-sm transition-all"
                      title="Copy to clipboard"
                    >
                      {copied === platform ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="p-4 bg-gray-100 shadow-neu-pressed-sm rounded-2xl whitespace-pre-wrap text-sm text-slate-700 border-none">
                    {generatedPosts[platform as keyof typeof generatedPosts]}
                  </div>
                </div>
              ))}

              <div className="bg-gray-100 p-6 rounded-[2rem] shadow-neu border-none">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Hashtags</h3>
                  <button
                    onClick={() => handleCopy(generatedPosts.hashtags, 'hashtags')}
                    className="p-2 bg-gray-100 shadow-neu rounded-full text-slate-500 hover:text-brand-primary hover:shadow-neu-pressed-sm transition-all"
                  >
                    {copied === 'hashtags' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="p-4 bg-gray-100 shadow-neu-pressed-sm rounded-2xl text-sm text-brand-primary font-medium border-none">
                  {generatedPosts.hashtags}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-gray-100 shadow-neu-pressed-sm rounded-[2rem] p-12 text-center border-none">
              <Share2 className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-600">No posts generated yet</p>
              <p className="text-sm mt-2">Enter your idea on the left and click generate to see the magic happen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
