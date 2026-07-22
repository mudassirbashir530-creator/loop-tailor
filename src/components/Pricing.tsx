import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { normalizePlanStatus } from '../lib/planUtils';

interface FeatureItem {
  label: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  priceLabel: string;
  description: string;
  badge: string | null;
  highlight: boolean;
  planId: string;
  buttonText: string;
  features: FeatureItem[];
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "Rs.0",
    priceLabel: "Free Forever",
    description: "Get started with basics",
    badge: null,
    highlight: false,
    planId: "free",
    buttonText: "Get Started Free →",
    features: [
      { label: "10 Customers", included: true },
      { label: "15 Orders/month", included: true },
      { label: "1 Worker", included: true },
      { label: "Basic Invoice", included: true },
      { label: "Standard Support", included: true },
      { label: "Invoice Download", included: false },
      { label: "WhatsApp Integration", included: false },
      { label: "Image Upload", included: false },
      { label: "Worker Management", included: false },
      { label: "Payroll System", included: false },
      { label: "Analytics", included: false }
    ]
  },
  {
    name: "Basic",
    price: "Rs.500",
    priceLabel: "/month",
    description: "Perfect for small shops",
    badge: null,
    highlight: false,
    planId: "basic",
    buttonText: "Get Started →",
    features: [
      { label: "50 Customers", included: true },
      { label: "60 Orders/month", included: true },
      { label: "3 Workers", included: true },
      { label: "Basic Invoice", included: true },
      { label: "Standard Support", included: true },
      { label: "Invoice Download", included: false },
      { label: "WhatsApp Integration", included: false },
      { label: "Image Upload", included: false },
      { label: "Payroll System", included: false },
      { label: "Analytics", included: false }
    ]
  },
  {
    name: "Standard",
    price: "Rs.1000",
    priceLabel: "/month",
    description: "For growing businesses",
    badge: "MOST POPULAR 🔥",
    highlight: true,
    planId: "standard",
    buttonText: "Upgrade to Standard →",
    features: [
      { label: "200 Customers", included: true },
      { label: "200 Orders/month", included: true },
      { label: "7 Workers", included: true },
      { label: "Professional Invoice", included: true },
      { label: "Invoice Download", included: true },
      { label: "WhatsApp Integration", included: true },
      { label: "Priority Support", included: true },
      { label: "Image Upload", included: false },
      { label: "Payroll System", included: false },
      { label: "Analytics", included: false }
    ]
  },
  {
    name: "Premium",
    price: "Rs.2000",
    priceLabel: "/month",
    description: "Full power for large shops",
    badge: "BEST VALUE ⭐",
    highlight: false,
    planId: "premium",
    buttonText: "Upgrade to Premium →",
    features: [
      { label: "Unlimited Customers", included: true },
      { label: "Unlimited Orders", included: true },
      { label: "Unlimited Workers", included: true },
      { label: "Professional Invoice", included: true },
      { label: "Invoice Download", included: true },
      { label: "WhatsApp Integration", included: true },
      { label: "Image Upload", included: true },
      { label: "Payroll System", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Custom Branding", included: true },
      { label: "WhatsApp Priority Support", included: true }
    ]
  }
];

export default function Pricing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
      behavior: 'smooth'
    });
    setActiveIndex(index);
  };

  return (
    <section id="pricing" className="py-24 bg-[#FDFCF9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4 font-sans">
            {t("landing.pricing.badge")}
          </h2>
          <h3
            className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900"
            dangerouslySetInnerHTML={{ __html: t("landing.pricing.title") }}
          ></h3>
        </div>

        {/* Outer scroll control context */}
        <div className="relative w-full">
          {/* Scroll container */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory'
            }}
            className="flex lg:grid lg:grid-cols-4 overflow-x-auto lg:overflow-x-visible pb-8 lg:pb-0 gap-6 lg:gap-6 max-w-full lg:max-w-[1200px] mx-auto px-[7.5vw] md:px-[15vw] lg:px-[12px] scrollbar-none items-stretch"
          >
            {plans.map((plan, index) => {
              const isActiveLocal = activeIndex === index;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={{ scrollSnapAlign: 'center' }}
                  className={`relative p-[1px] rounded-[2.5rem] bg-gradient-to-b ${
                    plan.highlight 
                      ? "from-brand-primary/40 to-brand-primary/10 shadow-xl scale-[1.0] lg:scale-[1.03] border-2 border-brand-primary/30" 
                      : "from-slate-200 to-transparent border border-slate-100"
                  } w-[85vw] md:w-[70vw] lg:w-auto min-w-[85vw] md:min-w-[70vw] lg:min-w-0 flex-shrink-0 flex flex-col h-full bg-white transition-all`}
                >
                  {plan.badge && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full shadow-md z-10 whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}
                  
                  <div className="bg-white rounded-[2.4rem] p-6 md:p-8 h-full flex flex-col flex-1">
                    <div className="mb-4">
                      <h4 className="text-2xl font-bold mb-1 text-slate-900 font-sans">
                        {plan.name}
                      </h4>
                      <p className="text-sm text-slate-500 min-h-[40px] font-sans">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price section same height */}
                    <div className="flex items-baseline gap-1 mb-6 min-h-[50px] border-b border-slate-50 pb-4">
                      <span className="text-3xl lg:text-4xl font-black text-slate-900 font-sans">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-mono">
                        {plan.priceLabel}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                            feature.included ? "bg-emerald-50" : "bg-slate-50"
                          }`}>
                            {feature.included ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <X className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <span className={`text-sm font-medium font-sans ${
                            feature.included ? "text-slate-700" : "text-slate-400 line-through decoration-1"
                          }`}>
                            {feature.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      size="lg"
                      onClick={() => navigate(`/login?intent=signup&plan=${normalizePlanStatus(plan.planId)}`)}
                      className={`w-full h-12 rounded-2xl ${
                        plan.highlight 
                          ? "bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20" 
                          : "bg-slate-105 hover:bg-slate-200 text-slate-900"
                      } text-sm font-bold transition-all mt-auto`}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dot Indicators for Mobile / Tablet */}
          <div className="flex lg:hidden justify-center items-center gap-2 mt-4">
            {plans.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToCard(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex === index ? "bg-brand-primary w-6" : "bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
