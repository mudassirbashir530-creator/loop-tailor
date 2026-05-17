import React from 'react';
import { motion } from 'motion/react';
import { Clock, Scissors, Layers, CheckSquare, Package, Truck } from 'lucide-react';
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
  const currentIndex = timelineSteps.findIndex(s => s.status === currentStatus);

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="min-w-[600px] flex items-start justify-between relative px-4">
        {/* Background linking line */}
        <div className="absolute top-6 left-8 right-8 h-1 bg-surface-container-highest z-0"></div>
        
        {/* Active linking line */}
        <div 
          className="absolute top-6 left-8 h-1 bg-primary z-0 transition-all duration-500 ease-in-out"
          style={{ width: `calc(${(Math.max(0, currentIndex) / (timelineSteps.length - 1)) * 100}% - 2rem)` }}
        ></div>

        {timelineSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const Icon = step.icon;

          const timestamp = statusHistory[step.status];

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center flex-1">
              <div className="relative">
                {isCurrent && (
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-primary opacity-20"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  ></motion.div>
                )}
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 border-surface shadow-sm transition-colors duration-300 relative z-10",
                    isCompleted || isCurrent ? "bg-primary" : "bg-surface-container-highest"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isCompleted || isCurrent ? "text-primary-foreground" : "text-on-surface-variant")} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className={cn("text-[10px] font-medium uppercase tracking-widest", (isCompleted || isCurrent) ? "text-primary" : "text-on-surface-variant")}>
                  {step.status}
                </div>
                {timestamp && (
                  <div className="text-[10px] text-on-surface-variant mt-1 font-medium whitespace-nowrap">
                    {format(new Date(timestamp), 'MMM d, h:mm a')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
