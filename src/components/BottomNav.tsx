import React from 'react';
import { Home, Users, FileText, PlusCircle, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = "home" | "clients" | "orders" | "new-order" | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "new-order", label: "New", icon: PlusCircle, isAction: true },
    { id: "orders", label: "Orders", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="flex items-center justify-around h-16 px-2 pb-safe bg-white">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isAction) {
          return (
            <div key={tab.id} className="relative -top-5">
              <button
                onClick={() => onTabChange(tab.id as TabType)}
                className="flex items-center justify-center w-14 h-14 bg-[#0D3D33] text-white rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                <Icon className="h-6 w-6" />
              </button>
            </div>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-1"
          >
            <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-[#0D3D33]" : "text-gray-400")} />
            <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-[#0D3D33]" : "text-gray-400")}>
              {tab.label}
            </span>
            <div className={cn("w-1 h-1 rounded-full mt-0.5 transition-all", isActive ? "bg-[#0D3D33] scale-100" : "bg-transparent scale-0")} />
          </button>
        );
      })}
    </div>
  );
}
