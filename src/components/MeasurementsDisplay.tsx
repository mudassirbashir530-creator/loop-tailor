import React from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';
import { Ruler } from 'lucide-react';

import { Button } from './ui/button';

export interface MeasurementsDisplayProps {
  measurements?: Record<string, string | number>;
  className?: string;
  title?: string;
  editAction?: () => void;
}

const ORDERED_FIELDS = [
  'KameezLength',
  'KameezChest',
  'KameezWaist',
  'KameezHip',
  'KameezShoulder',
  'KameezArmLength',
  'KameezArmWidth',
  'KameezCuffSize',
  'KameezCollarSize',
  'KameezFrontLength',
  'KameezBackLength',
  'DamanDesign',
  'CollarStyle',
  'SidePocket',
  'SlitStyle'
];

export function MeasurementsDisplay({ measurements, className, title = "Dimensions & Specifications", editAction }: MeasurementsDisplayProps) {
  if (!measurements || Object.keys(measurements).length === 0) {
    return null;
  }

  // Format label: split CamelCase or PascalCase into words
  const formatLabel = (key: string) => {
    const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  // Sort measurements: target fields first in their specific order, then others
  const sortedEntries = Object.entries(measurements).sort(([keyA], [keyB]) => {
    const idxA = ORDERED_FIELDS.indexOf(keyA);
    const idxB = ORDERED_FIELDS.indexOf(keyB);
    
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return keyA.localeCompare(keyB);
  });

  return (
    <Card className={cn("overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#0D3D33]/10 p-2 rounded-xl">
              <Ruler className="h-5 w-5 text-[#0D3D33]" />
            </div>
            <h3 className="text-lg font-bold text-[#0D3D33] tracking-tight">{title}</h3>
          </div>
          {editAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={editAction}
              className="text-[#0D3D33] hover:bg-[#0D3D33]/5 hover:text-[#0D3D33] h-8 px-4 rounded-full text-xs font-bold border border-gray-200 bg-white"
            >
              Edit
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-2">
          {sortedEntries.map(([key, value]) => {
            if (value === undefined || value === null || value === '') return null;
            
            return (
              <div key={key} className="flex flex-col items-start min-w-0 border-b border-gray-50 pb-3">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase break-words w-full leading-none">
                  {formatLabel(key)}
                </span>
                <span className="text-sm md:text-[15px] font-bold text-slate-800 mt-1.5 break-words w-full">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
