import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { Card, CardContent } from '../components/ui/card';

const posts = [
  {
    title: "The Future of Bespoke Tailoring",
    excerpt: "How digital tools are changing the craft and helping tailors scale their businesses while maintaining quality.",
    date: "Mar 15, 2026",
    image: "https://picsum.photos/seed/tailor1/600/400"
  },
  {
    title: "Managing Customer Measurements",
    excerpt: "Best practices for accuracy, privacy, and keeping your clients happy with perfect fits every time.",
    date: "Mar 02, 2026",
    image: "https://picsum.photos/seed/tailor2/600/400"
  },
  {
    title: "Loop Tailor 2.0 Released",
    excerpt: "What's new in our latest release, including offline mode, multi-shop support, and a brand new interface.",
    date: "Feb 18, 2026",
    image: "https://picsum.photos/seed/tailor3/600/400"
  },
  {
    title: "Marketing Your Tailor Shop",
    excerpt: "Simple strategies to attract more customers and build a loyal client base in your local area.",
    date: "Jan 25, 2026",
    image: "https://picsum.photos/seed/tailor4/600/400"
  },
  {
    title: "The Importance of Fabric Tracking",
    excerpt: "Why keeping track of fabric inventory can save you money and prevent last-minute sourcing panics.",
    date: "Jan 10, 2026",
    image: "https://picsum.photos/seed/tailor5/600/400"
  },
  {
    title: "Streamlining Your Workshop",
    excerpt: "Tips on organizing your physical space to match your new digital workflow for maximum efficiency.",
    date: "Dec 05, 2025",
    image: "https://picsum.photos/seed/tailor6/600/400"
  }
];

export default function Blog() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Blog & Insights</h1>
          <p className="text-xl text-slate-600">The latest news, updates, and insights from our team on the tailoring industry.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-none shadow-md h-full flex flex-col group">
                <div className="overflow-hidden h-56">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <CardContent className="p-8 flex-1 flex flex-col">
                  <p className="text-sm text-brand-primary font-bold mb-3 uppercase tracking-wider">{post.date}</p>
                  <h3 className="text-2xl font-display font-bold mb-4 text-slate-900 group-hover:text-brand-primary transition-colors">{post.title}</h3>
                  <p className="text-slate-600 leading-relaxed flex-1">{post.excerpt}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
