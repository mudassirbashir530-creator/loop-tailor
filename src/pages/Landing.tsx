import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { user, wasLoggedIn } = useAuth();

  if (user || wasLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-background text-on-background font-plus-jakarta min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-2xl" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>straighten</span>
            <span className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-500 font-plus-jakarta">LoopTailor</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <span className="text-green-600 font-bold border-b-2 border-green-600 pb-1 font-plus-jakarta text-sm">Home</span>
            <Link to="/about" className="text-slate-600 dark:text-slate-400 font-medium hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 font-plus-jakarta text-sm">About Us</Link>
          </nav>
          <Link to="/login">
            <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-label-md active:scale-95 transition-transform hover:bg-primary/90">
                Get Started
            </button>
          </Link>
        </div>
      </header>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative px-6 md:px-12 py-16 md:py-32 max-w-7xl mx-auto hero-gradient">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                The Professional Standard for Modern Tailors
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface text-h1 leading-tight">
                Precision <span className="text-primary">Tailoring</span>, Managed Smarter
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant text-body-lg max-w-xl">
                The all-in-one platform for modern tailors to manage orders, customers, and measurements with ease. Elevate your craft with digital efficiency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <button className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all">
                    Get Started Free
                  </button>
                </Link>
                <Link to="/login">
                  <button className="flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant px-8 py-4 rounded-full font-bold text-lg hover:bg-surface-container-low transition-all">
                    <span className="material-symbols-outlined">play_circle</span>
                    View Demo
                  </button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-surface-container-lowest p-4 rounded-[32px] shadow-2xl border border-outline-variant/30 overflow-hidden">
                <img alt="LoopTailor Dashboard" className="rounded-[24px] w-full h-auto object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEQBZFpBG4UBtigC3CeZ_mOfmESEspvB7HHNIcycUrJaxNz6TebgY9nCjx_holgj_okHG3cklZ2dUn-7z1hn_5IXah60PCjqdzitMoCDhZALQi1P0yKmzNE4odRyyi_ijKAEQj6NJNoqhouiGsrCgmKK1mdsA__xHGJ9TIag5NbRUTI3-dIeAW1bk0LjNgJpvsPfdt8m-7WSmiMP8DwmnjnN5YRMxr1-hzhzWlJK5fe_6ecnU874Afp7THw5ccfPDINOaOEhoWTvs" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-card shadow-xl border border-outline-variant flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-fixed">pending_actions</span>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Active Orders</p>
                  <p className="text-h3 font-bold">124 Orders</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="bg-surface-container-low py-12">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
            <p className="text-label-md text-slate-500 uppercase tracking-widest">Trusted by 500+ master tailors worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale">
              <div className="flex items-center gap-2 font-bold text-2xl"><span className="material-symbols-outlined">diamond</span> SAVILE</div>
              <div className="flex items-center gap-2 font-bold text-2xl"><span className="material-symbols-outlined">architecture</span> BRIONI</div>
              <div className="flex items-center gap-2 font-bold text-2xl"><span className="material-symbols-outlined">content_cut</span> ATELIER</div>
              <div className="flex items-center gap-2 font-bold text-2xl"><span className="material-symbols-outlined">palette</span> STITCH</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl text-h2 text-on-surface">Crafted for the Modern Workshop</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Every tool you need to streamline your bespoke tailoring business, from initial consultation to final fitting.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-8 rounded-card border border-outline-variant hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-3xl">list_alt</span>
              </div>
              <h3 className="text-xl text-h3 mb-3">Order Tracking</h3>
              <p className="text-body-md text-on-surface-variant">Real-time status updates for every garment in production. Never miss a deadline again.</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-card border border-outline-variant hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-3xl">group</span>
              </div>
              <h3 className="text-xl text-h3 mb-3">Customer CRM</h3>
              <p className="text-body-md text-on-surface-variant">Maintain detailed profiles, fitting histories, and preferences for every client in one secure place.</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-card border border-outline-variant hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-3xl">straighten</span>
              </div>
              <h3 className="text-xl text-h3 mb-3">Digital Measurements</h3>
              <p className="text-body-md text-on-surface-variant">Standardized measurement templates for various garments. Sync across all your devices instantly.</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-card border border-outline-variant hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-3xl">style</span>
              </div>
              <h3 className="text-xl text-h3 mb-3">Design Library</h3>
              <p className="text-body-md text-on-surface-variant">Organize fabric swatches, pattern sketches, and design inspirations for easy collaboration.</p>
            </div>
          </div>
        </section>

        {/* Measurement UI Demo / Asymmetric Layout */}
        <section className="py-24 bg-surface px-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-1 bg-primary mb-4"></div>
              <h2 className="text-4xl text-h2 leading-tight">Meticulous Detail,<br/>Digital Precision.</h2>
              <p className="text-body-lg text-on-surface-variant">Our unique measurement interface was designed with real tailors in mind. It mimics the flow of a physical fitting, ensuring no detail is overlooked.</p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between py-3 border-b border-dotted border-outline">
                  <span className="text-on-surface-variant font-medium">Chest Circumference</span>
                  <span className="text-primary font-bold text-xl">42.5 in</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-dotted border-outline">
                  <span className="text-on-surface-variant font-medium">Shoulder Width</span>
                  <span className="text-primary font-bold text-xl">18.2 in</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-dotted border-outline">
                  <span className="text-on-surface-variant font-medium">Sleeve Length</span>
                  <span className="text-primary font-bold text-xl">25.0 in</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-fixed/20 rounded-[40px] rotate-3 -z-10"></div>
                <img alt="Measurement Tool" className="rounded-card shadow-2xl w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCsr9sieKeeMlTVV191J8j5RfCxPZInPfFZFDZEcPYV1WzSXDiVfun-fMfJjyRT94nRL1MSO_B8CvSMtGJ8S9Pjj0MvVCFafHQrhRdVUccLHFr9UDHB0L83GhQXfhH13kJY0B4msFImtSwAaaSbCH8lYxYKDb4bSwmZCB6Kb9mIbtpnNqqOXuPB2ZYTqli0zzrMYI3pM1OOb39ciRDydzudNEdd6aoPraWtq6sMtDo8LyJ41MwRd6VXAObge9DQL3U9f4xA9Kz_Ec" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 bg-surface-container-high relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <span className="material-symbols-outlined text-primary text-6xl opacity-30" style={{fontVariationSettings: "'FILL' 1"}}>format_quote</span>
            <p className="text-2xl md:text-3xl font-medium leading-relaxed italic text-on-surface">
              "LoopTailor has completely transformed how we handle bespoke commissions. We've reduced measurement errors by 40% and our customers love the digital updates on their suit's progress."
            </p>
            <div className="flex flex-col items-center gap-4">
              <img alt="Giovanni Rossi" className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover object-top" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXZi3hSrbajAdavpfxVCcKFOTzP--IBCkEZqWJ2Bhtxhza96-Wjt0Wa9O5eSkp5C9QDIJ0KueucIMa7U9iCgeFYwnHK9rdUg3aNZrrvJEssJKu3Ydru71PPVKXb62s8pbDwbuFL-MJbK54exqlYHxmRAB5_T9oEH31fybqE6pF_SUd0JX_ZaDGmpgEPoRMaAtsB7ZafV6rRcgBbbyeIdZi0oVzLSoF0tg5W7LMeohazop5qBSpDFxnqVJtvgMD_5oGUuh16td-PNk" />
              <div>
                <p className="font-bold text-lg">Giovanni Rossi</p>
                <p className="text-on-surface-variant text-sm uppercase tracking-widest">Master Tailor, Rossi & Sons</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-on-surface text-surface-container-lowest rounded-[40px] p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <h2 className="text-4xl md:text-6xl text-h1 leading-tight relative z-10">Ready to transform your tailor shop?</h2>
            <p className="text-xl text-surface-dim max-w-2xl mx-auto relative z-10">Join hundreds of professional tailors who are scaling their business with LoopTailor.</p>
            <div className="flex justify-center relative z-10">
              <Link to="/signup">
                <button className="bg-primary text-on-primary px-12 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform">
                  Get Started Free
                </button>
              </Link>
            </div>
            <p className="text-sm text-surface-dim/60 relative z-10">No credit card required. Cancel anytime.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-16 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-xl font-plus-jakarta">straighten</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-50 font-plus-jakarta">LoopTailor</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center md:text-left">Bringing digital precision to the artisanal world of tailoring.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link className="text-slate-500 dark:text-slate-400 text-sm font-plus-jakarta hover:text-green-600 dark:hover:text-green-400 hover:underline transition-colors" to="/about">About Us</Link>
            <Link className="text-slate-500 dark:text-slate-400 text-sm font-plus-jakarta hover:text-green-600 dark:hover:text-green-400 hover:underline transition-colors" to="/privacy">Privacy Policy</Link>
            <Link className="text-slate-500 dark:text-slate-400 text-sm font-plus-jakarta hover:text-green-600 dark:hover:text-green-400 hover:underline transition-colors" to="/terms">Terms of Service</Link>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm font-plus-jakarta">
            © 2026 LoopTailor. Crafted for Precision.
          </div>
        </div>
      </footer>
    </div>
  );
}
