export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free Forever",
    description: "Get started with basics",
    limits: {
      customers: 10,
      ordersPerMonth: 15,
      workers: 1
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
      canUseWhatsApp: false,
      canUsePayroll: true,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    },
    featureList: [
      { label: "10 Customers", included: true },
      { label: "15 Orders/month", included: true },
      { label: "1 Worker", included: true },
      { label: "Basic Invoice & Download", included: true },
      { label: "Image Upload", included: true },
      { label: "Standard Support", included: true },
      { label: "WhatsApp Integration", included: false },
      { label: "Worker Management (Multi-worker)", included: false },
      { label: "Payroll System", included: false },
      { label: "Advanced Analytics", included: false }
    ]
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: 500,
    priceLabel: "Rs.500/month",
    description: "Perfect for small shops",
    limits: {
      customers: 50,
      ordersPerMonth: 60,
      workers: 3
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
      canUseWhatsApp: false,
      canUsePayroll: true,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    },
    featureList: [
      { label: "50 Customers", included: true },
      { label: "60 Orders/month", included: true },
      { label: "3 Workers", included: true },
      { label: "Invoice Download", included: true },
      { label: "Worker Management", included: true },
      { label: "Image Upload", included: true },
      { label: "Standard Support", included: true },
      { label: "WhatsApp Integration", included: false },
      { label: "Payroll System", included: false },
      { label: "Advanced Analytics", included: false }
    ]
  },
  standard: {
    id: "standard",
    name: "Standard",
    price: 1000,
    priceLabel: "Rs.1000/month",
    description: "For growing businesses",
    limits: {
      customers: 200,
      ordersPerMonth: 200,
      workers: 7
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
      canUseWhatsApp: true,
      canUsePayroll: true,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    },
    featureList: [
      { label: "200 Customers", included: true },
      { label: "200 Orders/month", included: true },
      { label: "7 Workers", included: true },
      { label: "Professional Invoice & PDF Download", included: true },
      { label: "WhatsApp Integration & Alerts", included: true },
      { label: "Worker Management", included: true },
      { label: "Priority Support", included: true },
      { label: "Image Upload", included: true },
      { label: "Payroll System", included: false },
      { label: "Advanced Analytics", included: false }
    ]
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 2000,
    priceLabel: "Rs.2000/month",
    description: "Full power for large shops",
    limits: {
      customers: 0,
      ordersPerMonth: 0,
      workers: 0
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
      canUseWhatsApp: true,
      canUsePayroll: true,
      canViewAnalytics: true,
      canCustomBranding: true,
      canManageWorkers: true
    },
    featureList: [
      { label: "Unlimited Customers", included: true },
      { label: "Unlimited Orders", included: true },
      { label: "Unlimited Workers", included: true },
      { label: "Professional Invoice & PDF Download", included: true },
      { label: "WhatsApp Integration", included: true },
      { label: "Worker Management", included: true },
      { label: "Payroll System", included: true },
      { label: "Advanced Shop Analytics", included: true },
      { label: "Custom Branding", included: true },
      { label: "WhatsApp Priority Support", included: true }
    ]
  }
} as const;

export const FEATURE_LABELS = {
  canDownloadInvoice: "Invoice Download",
  canUploadImages: "Image Upload",
  canUseWhatsApp: "WhatsApp Integration",
  canUsePayroll: "Payroll System",
  canViewAnalytics: "Advanced Analytics",
  canCustomBranding: "Custom Branding",
  canManageWorkers: "Worker Management"
} as const;

export const REQUIRED_PLAN = {
  canDownloadInvoice: "free",
  canUploadImages: "free",
  canUseWhatsApp: "standard",
  canUsePayroll: "premium",
  canViewAnalytics: "premium",
  canCustomBranding: "premium",
  canManageWorkers: "free"
} as const;
