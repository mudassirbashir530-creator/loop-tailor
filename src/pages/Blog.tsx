import React, { useState, useEffect } from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

interface Article {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  featuredImage: string;
  imageAlt: string;
  createdAt: any;
  category: string;
  language: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Article[];
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <PublicLayout>
      <SEO 
        title="Blog & Insights | Loop Tailor"
        description="The latest news, updates, and insights from our team on the tailoring industry."
        keywords="tailoring blog, tailor management software, boutique management"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Blog & Insights</h1>
          <p className="text-xl text-slate-600">The latest news, updates, and insights from our team on the tailoring industry.</p>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-xl">No articles published yet.</p>
            <p className="mt-2">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => {
              const formattedDate = post.createdAt?.toDate 
                ? post.createdAt.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Recently';
              
              const isUrdu = post.language === 'ur';

              return (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link to={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-none shadow-md h-full flex flex-col group">
                      <div className="overflow-hidden h-56 relative">
                        {post.featuredImage ? (
                          <img 
                            src={post.featuredImage} 
                            alt={post.imageAlt || post.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                            No Image
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-8 flex-1 flex flex-col">
                        <p className="text-sm text-slate-500 font-medium mb-3">{formattedDate}</p>
                        <h3 className={`text-2xl font-bold mb-4 text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-2 ${isUrdu ? 'font-urdu text-right' : 'font-display'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
                          {post.title}
                        </h3>
                        <p className={`text-slate-600 leading-relaxed flex-1 line-clamp-3 ${isUrdu ? 'font-urdu text-right' : ''}`} dir={isUrdu ? 'rtl' : 'ltr'}>
                          {post.subtitle}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
