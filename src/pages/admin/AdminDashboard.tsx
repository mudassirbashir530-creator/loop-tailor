import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileText, Share2, Image as ImageIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    articles: 0,
    socialPosts: 0,
    media: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [articlesSnap, postsSnap, mediaSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'articles')),
          getDocs(collection(db, 'social_posts')),
          getDocs(collection(db, 'media_library')),
          getDocs(collection(db, 'users')),
        ]);

        setStats({
          articles: articlesSnap.size,
          socialPosts: postsSnap.size,
          media: mediaSnap.size,
          users: usersSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Articles', value: stats.articles, icon: FileText, color: 'text-blue-600', link: '/admin/articles' },
    { name: 'Social Posts', value: stats.socialPosts, icon: Share2, color: 'text-purple-600', link: '/admin/social' },
    { name: 'Media Files', value: stats.media, icon: ImageIcon, color: 'text-emerald-600', link: '/admin/media' },
    { name: 'Total Users', value: stats.users, icon: Users, color: 'text-orange-600', link: '/admin/users' },
  ];

  if (loading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.link} className="bg-gray-100 rounded-[2rem] shadow-neu border-none p-6 flex items-center gap-4 hover:shadow-neu-pressed-sm transition-all">
            <div className={`p-4 rounded-2xl bg-gray-100 shadow-neu-pressed-sm ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-100 rounded-[2rem] shadow-neu border-none p-6 mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/articles/new" className="px-4 py-2 bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm rounded-xl transition-all border-none font-bold">
            Write New Article
          </Link>
          <Link to="/admin/social" className="px-4 py-2 bg-gray-100 shadow-neu-sm text-slate-700 hover:shadow-neu-pressed-sm rounded-xl transition-all border-none font-bold">
            Generate Social Post
          </Link>
          <Link to="/admin/media" className="px-4 py-2 bg-gray-100 shadow-neu-sm text-slate-700 hover:shadow-neu-pressed-sm rounded-xl transition-all border-none font-bold">
            Upload Media
          </Link>
        </div>
      </div>
    </div>
  );
};
