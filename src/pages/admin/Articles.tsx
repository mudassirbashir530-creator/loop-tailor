import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'published';
  category: string;
  language: string;
  createdAt: string;
}

export const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedArticles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];
      setArticles(fetchedArticles);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteDoc(doc(db, 'articles', id));
        setArticles(articles.filter(a => a.id !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `articles/${id}`);
      }
    }
  };

  if (loading) {
    return <div className="text-slate-500">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Articles</h1>
        <Link
          to="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm rounded-xl transition-all border-none font-bold"
        >
          <Plus className="w-4 h-4" />
          New Article
        </Link>
      </div>

      <div className="bg-gray-100 rounded-[2rem] shadow-neu border-none overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-transparent">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Language</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-200/50">
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-slate-500 text-sm">
                  No articles found. Create your first one!
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-100 hover:shadow-neu-pressed-sm transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-[#0D3D33]' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {article.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {article.language === 'ur' ? 'Urdu' : 'English'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Link to={`/admin/articles/edit/${article.id}`} className="p-2 bg-gray-100 shadow-neu-sm text-indigo-600 hover:text-indigo-900 rounded-lg hover:shadow-neu-pressed-sm transition-all border-none">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(article.id)} className="p-2 bg-gray-100 shadow-neu-sm text-red-600 hover:text-red-900 rounded-lg hover:shadow-neu-pressed-sm transition-all border-none">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
