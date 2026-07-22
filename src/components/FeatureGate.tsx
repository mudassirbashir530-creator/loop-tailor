import React, { useState } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FEATURE_LABELS } from '../constants/plans';
import FeatureLockModal from './FeatureLockModal';
import { Lock } from 'lucide-react';

export interface FeatureGateProps {
  feature: keyof typeof FEATURE_LABELS;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  // If true, wraps the children in a div that looks disabled and overlays a lock icon
  inlineLock?: boolean;
  className?: string;
}

export function FeatureGate({ feature, children, fallback, inlineLock = true, className = '' }: FeatureGateProps) {
  const features = useFeatureAccess();
  const [modalOpen, setModalOpen] = useState(false);

  // Still loading auth state
  if (features.isLoading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }

  const hasAccess = features[feature];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inlineLock) {
    return (
      <>
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalOpen(true);
          }}
          className={`relative group cursor-pointer ${className}`}
        >
          {/* Render children but visually disabled */}
          <div className="opacity-50 grayscale pointer-events-none transition-all duration-200 group-hover:opacity-40">
            {children}
          </div>
          {/* Overlay Lock */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/10 backdrop-blur-[2px] rounded-full p-2 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <Lock className="w-5 h-5 drop-shadow-md" />
            </div>
          </div>
        </div>
        <FeatureLockModal 
          feature={feature} 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      </>
    );
  }

  // Not inline overlay
  return (
    <>
      <div 
        onClick={() => setModalOpen(true)}
        className={className || "cursor-pointer"}
      >
        {children}
      </div>
      <FeatureLockModal 
        feature={feature} 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
}

export default FeatureGate;
