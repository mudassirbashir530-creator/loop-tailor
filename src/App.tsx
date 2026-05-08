import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ShopProvider } from './contexts/ShopContext';
import Landing from './pages/Landing';
import { Toaster } from 'sonner';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="animate-spin h-12 w-12 border-4 border-[#0D3D33] border-t-transparent rounded-full" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  // Assuming login will be in the app or a separate route later
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Landing acts as the public entry, routing to public/landing via effect */}
                <Route path="/" element={<Landing />} />
                
                {/* App Wrapper - To be designed from Figma */}
                <Route path="/app/*" element={
                  <PrivateRoute>
                    <div className="text-gray-900 bg-[#F7F5F0] min-h-screen flex items-center justify-center">
                      <p>Workspace ready for Figma Design rebuild.</p>
                    </div>
                  </PrivateRoute>
                } />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </LanguageProvider>
      </ShopProvider>
    </AuthProvider>
  );
}
