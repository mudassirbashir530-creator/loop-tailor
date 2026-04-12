import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  tags: string[];
  language: string;
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string[];
  slug: string;
  featuredImage: string;
  imageAlt: string;
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function ArticleView() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const q = query(
          collection(db, 'articles'),
          where('slug', '==', slug),
          where('status', '==', 'published'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setArticle({ id: doc.id, ...doc.data() } as Article);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !article) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Article Not Found</h1>
          <p className="text-slate-600 mb-8">The article you are looking for does not exist or has been removed.</p>
          <Link to="/blog" className="text-brand-primary hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const formattedDate = article.createdAt?.toDate 
    ? article.createdAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recently';

  const isUrdu = article.language === 'ur';

  return (
    <PublicLayout>
      <SEO 
        title={article.metaTitle || article.title}
        description={article.metaDescription || article.subtitle}
        keywords={article.seoKeywords?.join(', ')}
        image={article.featuredImage}
        type="article"
      />
      
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <Link to="/blog" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all articles
        </Link>
        
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium">
              {article.category}
            </span>
            <div className="flex items-center text-slate-500 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              {formattedDate}
            </div>
          </div>
          
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight ${isUrdu ? 'font-urdu' : 'font-display'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
            {article.title}
          </h1>
          
          {article.subtitle && (
            <p className={`text-xl md:text-2xl text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`} dir={isUrdu ? 'rtl' : 'ltr'}>
              {article.subtitle}
            </p>
          )}
        </header>

        {article.featuredImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 rounded-2xl overflow-hidden shadow-xl"
          >
            <img 
              src={article.featuredImage} 
              alt={article.imageAlt || article.title} 
              className="w-full h-auto max-h-[600px] object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}

        <div 
          className={`prose prose-lg md:prose-xl max-w-none prose-slate prose-headings:font-display prose-a:text-brand-primary ${isUrdu ? 'font-urdu text-right' : ''}`}
          dir={isUrdu ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-5 h-5 text-slate-400" />
              {article.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </PublicLayout>
  );
}
