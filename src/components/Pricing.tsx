import React from "react";
import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";

const plans = [
  {
    name: "Free Trial",
    price: "0",
    duration: "1 Month",
    description: "Perfect to explore all our features.",
    features: [
      "Full access to all features",
      "Order management",
      "Customer management",
      "Staff assignment",
      "Invoice system",
      "WhatsApp notifications",
    ],
    buttonText: "Start Free Trial",
    highlight: true,
    planId: "Free Trial",
  },
  {
    name: "Basic",
    price: "PKR 500",
    duration: "/ month",
    description: "Essential tools for small shops.",
    features: ["CMS", "Worker Assign"],
    buttonText: "Get Started",
    highlight: false,
    planId: "Basic",
  },
  {
    name: "Standard",
    price: "PKR 1,000",
    duration: "/ month",
    description: "Everything you need to manage one shop.",
    features: ["CMS", "Worker Assign", "WhatsApp Integration"],
    buttonText: "Get Started",
    highlight: false,
    planId: "Standard",
  },
  {
    name: "Premium",
    price: "PKR 2,000",
    duration: "/ month",
    description: "Advanced tools and digital invoicing.",
    features: [
      "CMS",
      "Worker Assign",
      "WhatsApp Integration",
      "Digital Invoice",
      "Image Upload",
    ],
    buttonText: "Get Started",
    highlight: false,
    planId: "Premium",
  },
];

import { normalizePlanStatus } from '../lib/planUtils';

export default function Pricing() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-[#FDFCF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">
            {t("landing.pricing.badge")}
          </h2>
          <h3
            className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900"
            dangerouslySetInnerHTML={{ __html: t("landing.pricing.title") }}
          ></h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative p-[2px] rounded-[2.5rem] bg-gradient-to-b ${plan.highlight ? "from-brand-primary/40" : "from-brand-primary/10"} to-transparent shadow-2xl shadow-brand-primary/5 h-full`}
            >
              <div className="bg-white rounded-[2.4rem] p-6 lg:p-8 h-full border border-slate-100 flex flex-col">
                <div className="mb-6">
                  <h4 className="text-2xl font-bold mb-1 text-slate-900">
                    {plan.name}
                  </h4>
                  <p className="text-sm text-slate-500 min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-3xl lg:text-4xl font-black text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {plan.duration}
                  </span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => navigate(`/login?intent=signup&plan=${normalizePlanStatus(plan.planId)}`)}
                  className={`w-full h-12 rounded-2xl ${plan.highlight ? "bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20" : "bg-slate-100 hover:bg-slate-200 text-slate-900"} text-base font-bold transition-all mt-auto`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
