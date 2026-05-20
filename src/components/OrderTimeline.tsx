import React from 'react';
import { motion } from 'motion/react';
import { Clock, Layers, Package, Truck, XCircle } from 'lucide-react';
import { ORDER_STATUS } from '../lib/config';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface OrderTimelineProps {
  currentStatus: string;
  statusHistory?: Record<string, string>;
}

const timelineSteps = [
  { status: ORDER_STATUS.PENDING, icon: Clock },
  { status: ORDER_STATUS.STITCHING, icon: Layers },
  { status: ORDER_STATUS.READY, icon: Package },
  { status: ORDER_STATUS.DELIVERED, icon: Truck },
];

export function OrderTimeline({ currentStatus, statusHistory = {} }: OrderTimelineProps) {
  if (currentStatus === ORDER_STATUS.CANCELLED) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <XCircle className="h-10 w-10 text-red-500" />
        <h3 className="text-red-700 font-semibold text-lg">Order Cancelled</h3>
        <p className="text-red-600/80 text-sm">
          {statusHistory[ORDER_STATUS.CANCELLED] && `Cancelled on ${format(new Date(statusHistory[ORDER_STATUS.CANCELLED]), 'MMM d, yyyy h:mm a')}`}
        </p>
      </div>
    );
  }

  const currentIndex = timelineSteps.findIndex(s => s.status === currentStatus);

  return (
    <div className="w-full">
      {/* 1. Mobile Timeline (Vertical UI - visible only on mobile screens) */}
      <div className="flex flex-col gap-0 md:hidden px-4 py-2">
        {timelineSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const Icon = step.icon;
          const timestamp = statusHistory[step.status];

          return (
            <div key={step.status} className="flex gap-4 items-start relative pb-8 last:pb-0">
              {/* Vertical Connection Line */}
              {index < timelineSteps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-6 top-12 bottom-0 w-1 z-0 transition-all duration-500",
                    isCompleted ? "bg-green-500" : "bg-slate-200"
                  )} 
                />
              )}

              {/* Status Circle */}
              <div className="relative shrink-0 z-10">
                {isCurrent && (
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-green-800 opacity-20"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 border-background shadow-xs transition-colors duration-300 relative z-10",
                    isCurrent ? "bg-green-800 text-white border-green-800" :
                    isCompleted ? "bg-green-500 text-white border-green-500" :
                    "bg-white border-slate-200 text-slate-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1 ml-1">
                <h4 
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider",
                    isCurrent ? "text-green-800 font-extrabold" :
                    isCompleted ? "text-green-600" :
                    "text-slate-400"
                  )}
                >
                  {step.status}
                </h4>
                {timestamp ? (
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    {format(new Date(timestamp), 'MMM d, h:mm a')}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic mt-0.5 select-none">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Timeline (Horizontal UI - visible only on md screens and above) */}
      <div className="hidden md:block w-full py-4">
        <div className="flex items-start justify-between relative px-6">
          {/* Background Linking Line */}
          <div className="absolute top-6 left-12 right-12 h-1 bg-slate-200 z-0"></div>
          
          {/* Active Linking Line */}
          <div 
            className="absolute top-6 left-12 h-1 bg-green-500 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `calc(${(Math.max(0, currentIndex) / (Math.max(1, timelineSteps.length - 1))) * 100}% - 3rem)` }}
          ></div>

          {timelineSteps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;
            const Icon = step.icon;
            const timestamp = statusHistory[step.status];

            return (
              <div key={step.status} className="relative z-10 flex flex-col items-center flex-1">
                {/* Status Icon Container */}
                <div className="relative">
                  {isCurrent && (
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-green-800 opacity-20"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-4 border-background shadow-xs transition-colors duration-300 relative z-10",
                      isCurrent ? "bg-green-800 text-white border-green-800" :
                      isCompleted ? "bg-green-500 text-white border-green-500" :
                      "bg-white border-slate-200 text-slate-400"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {/* Status Information */}
                <div className="mt-4 text-center">
                  <div 
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isCurrent ? "text-green-800 font-extrabold" :
                      isCompleted ? "text-green-600" :
                      "text-slate-400"
                    )}
                  >
                    {step.status}
                  </div>
                  {timestamp && (
                    <div className="text-[10px] text-slate-500 mt-1 font-medium whitespace-nowrap">
                      {format(new Date(timestamp), 'MMM d, h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
