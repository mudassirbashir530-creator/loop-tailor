import React, { useRef, useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlanLimits } from "../hooks/usePlanLimits";
import { Button } from "./ui/button";
import { openWhatsApp } from "../lib/whatsapp";
import { cn } from "../lib/utils";
import { PLANS } from "../constants/plans";

interface SubscriptionProps {
  isModal?: boolean;
}

export default function Subscription({ isModal = false }: SubscriptionProps) {
  const { user, userData } = useAuth();
  const { usage } = usePlanLimits();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Read current active plan
  const currentPlan = (userData?.plan || "free").toLowerCase();
  const currentPlanObj = PLANS[currentPlan as keyof typeof PLANS] || PLANS.free;
  const currentPlanPrice = currentPlanObj ? currentPlanObj.price : 0;

  const handlePlanAction = (targetPlanName: string, isLower: boolean) => {
    const userEmail = user?.email || "N/A";
    const actionType = isLower ? "downgrade" : "upgrade";
    const message = `Hi, I want to ${actionType} my Loop Tailor plan to ${targetPlanName}.\nMy account: ${userEmail}`;
    openWhatsApp("03321379924", message);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const scrollToCard = (index: number) => {
    if (!containerRef.current) return;
    const clientWidth = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: clientWidth * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  // Safe and clean configuration for active plan's usage progress bars
  const getUsageConfig = (label: string, current: number, max: number) => {
    if (max === 0) {
      return {
        percentage: 100,
        barColorClass: "bg-emerald-500",
        isWarning: false,
        text: `${current} / Unlimited`,
      };
    }
    const percentage = Math.min(100, (current / max) * 100);
    let barColorClass = "bg-emerald-500";
    let isWarning = false;

    if (percentage === 100) {
      barColorClass = "bg-red-500";
      isWarning = true;
    } else if (percentage >= 80) {
      barColorClass = "bg-amber-500";
      isWarning = true;
    }

    return {
      percentage,
      barColorClass,
      isWarning,
      text: `${current}/${max}`,
    };
  };

  return (
    <div className={cn("w-full mx-auto", isModal ? "px-0" : "px-0")}>
      {/* Scrollable / Grid Container */}
      <div className="relative w-full">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
          }}
          className={cn(
            "flex lg:grid lg:grid-cols-4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-4 max-w-full scrollbar-none items-stretch px-4 lg:px-0 [&::-webkit-scrollbar]:hidden"
          )}
        >
          {Object.values(PLANS).map((plan, index) => {
            const isActive = currentPlan === plan.id.toLowerCase();
            const isLower = plan.price < currentPlanPrice;
            const isHigher = plan.price > currentPlanPrice;

            // Price formatted cleanly
            const priceDisplay = plan.id === "free" ? "Rs.0" : `Rs.${plan.price}/mo`;

            return (
              <div
                key={plan.id}
                style={{ scrollSnapAlign: "center" }}
                className={cn(
                  "w-[calc(85vw-32px)] lg:w-full min-w-[calc(85vw-32px)] lg:min-w-0 flex-shrink-0 flex flex-col justify-between transition-all duration-300 bg-white dark:bg-slate-900 shadow-xs select-none snap-center h-full overflow-hidden border rounded-2xl p-4 md:p-5 break-words",
                  isActive
                    ? "border-2 border-[#1a3a2a] dark:border-[#2ECC71] ring-4 ring-[#1a3a2a]/5 shadow-md scale-100 lg:scale-[1.02] z-10"
                    : "border-slate-200 dark:border-slate-800 opacity-95"
                )}
              >
                {/* Upper section */}
                <div className="flex flex-col flex-grow">
                  {/* 1. Plan Name */}
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      {plan.name}
                    </h3>
                    {isActive ? (
                      <span className="text-[9px] bg-[#1a3a2a]/10 dark:bg-emerald-500/10 text-[#1a3a2a] dark:text-[#2ECC71] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        YOUR CURRENT PLAN
                      </span>
                    ) : plan.id === "premium" ? (
                      <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-500 uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        ⭐ Best Value
                      </span>
                    ) : plan.id === "standard" ? (
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-300/30 text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        🔥 Popular
                      </span>
                    ) : null}
                  </div>

                  {/* 2. Description */}
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight mb-3">
                    {plan.description}
                  </p>

                  {/* 3. Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className="font-black text-slate-900 dark:text-white leading-none whitespace-nowrap"
                        style={{ fontSize: "clamp(1.2rem, 2vw, 1.8rem)" }}
                      >
                        {priceDisplay}
                      </span>
                    </div>
                  </div>

                  {/* 4. Current Usage bars (ONLY on active plan) */}
                  {isActive && (
                    <div className="mb-4 space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                      {/* Customers Bar */}
                      {(() => {
                        const { percentage, barColorClass, isWarning, text } = getUsageConfig(
                          "CUSTOMERS",
                          usage.customers,
                          plan.limits.customers
                        );
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-0.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                              <span className="flex items-center gap-0.5">Customers {isWarning && "⚠️"}</span>
                              <span className="font-mono text-[9px] font-semibold">{text}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", barColorClass)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Orders Bar */}
                      {(() => {
                        const { percentage, barColorClass, isWarning, text } = getUsageConfig(
                          "ORDERS",
                          usage.ordersThisMonth,
                          plan.limits.ordersPerMonth
                        );
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-0.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                              <span className="flex items-center gap-0.5">Orders/mo {isWarning && "⚠️"}</span>
                              <span className="font-mono text-[9px] font-semibold">{text}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", barColorClass)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Workers Bar */}
                      {(() => {
                        const { percentage, barColorClass, isWarning, text } = getUsageConfig(
                          "WORKERS",
                          usage.workers,
                          plan.limits.workers
                        );
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-0.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                              <span className="flex items-center gap-0.5">Workers {isWarning && "⚠️"}</span>
                              <span className="font-mono text-[9px] font-semibold">{text}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", barColorClass)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 5. Feature List */}
                  <div className="space-y-2 mb-4 flex-grow border-t border-slate-100 dark:border-slate-800 pt-3">
                    {plan.featureList.map((f) => (
                      <div
                        key={f.label}
                        className={cn(
                          "flex items-start gap-1.5 text-xs font-medium leading-tight",
                          !f.included && "opacity-45"
                        )}
                      >
                        {f.included ? (
                          <Check className="w-[14px] h-[14px] text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-[14px] h-[14px] text-red-500 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            "break-words text-slate-700 dark:text-slate-200 whitespace-normal text-[11px] md:text-xs",
                            !f.included && "line-through text-slate-400 dark:text-slate-600"
                          )}
                        >
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Action Button (always at the very bottom) */}
                <div className="mt-auto pt-2">
                  {isActive ? (
                    <Button
                      variant="secondary"
                      className="w-full h-10 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent select-none uppercase"
                      disabled
                    >
                      Current Plan ✓
                    </Button>
                  ) : isLower ? (
                    <Button
                      onClick={() => handlePlanAction(plan.name, true)}
                      variant="outline"
                      className="w-full h-10 rounded-xl font-bold text-xs border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800 uppercase"
                    >
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePlanAction(plan.name, false)}
                      className="w-full h-10 rounded-xl font-bold text-xs bg-[#1a3a2a] hover:bg-[#1a3a2a]/90 text-white shadow-xs active:scale-[0.98] transition-all uppercase"
                    >
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex lg:hidden justify-center items-center gap-1.5 mt-4 mb-3">
        {Object.values(PLANS).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToCard(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              activeIndex === index
                ? "bg-[#1a3a2a] dark:bg-[#2ECC71] w-5"
                : "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-400"
            )}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
