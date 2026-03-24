import { Link } from 'react-router-dom';
import { Home, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="w-full max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold mb-6">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          <span>Oops! Page not found</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">404</h1>
        <p className="text-slate-300 text-lg mb-8">
          We couldn&apos;t find the page you were looking for. Let&apos;s get you back to your tailoring dashboard.
        </p>
        <Link to="/">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6">
            <Home className="h-4 w-4 mr-2" />
            Go to home
          </Button>
        </Link>
      </section>
    </main>
  );
}
