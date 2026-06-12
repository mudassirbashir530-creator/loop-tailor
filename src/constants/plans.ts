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
      canDownloadInvoice: false,
      canUploadImages: false,
      canUseWhatsApp: false,
      canUsePayroll: false,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: false
    },
    featureList: [
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
      canDownloadInvoice: false,
      canUploadImages: false,
      canUseWhatsApp: false,
      canUsePayroll: false,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    },
    featureList: [
      { label: "50 Customers", included: true },
      { label: "60 Orders/month", included: true },
      { label: "3 Workers", included: true },
      { label: "Basic Invoice", included: true },
      { label: "Standard Support", included: true },
      { label: "Invoice Download", included: false },
      { label: "WhatsApp Integration", included: false },
      { label: "Image Upload", included: false },
      { label: "Payroll System", included: false },
      { label: "Advanced Analytics", included: false },
      { label: "Custom Branding", included: false }
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
      canUploadImages: false,
      canUseWhatsApp: true,
      canUsePayroll: false,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    },
    featureList: [
      { label: "200 Customers", included: true },
      { label: "200 Orders/month", included: true },
      { label: "7 Workers", included: true },
      { label: "Professional Invoice", included: true },
      { label: "Invoice Download", included: true },
      { label: "WhatsApp Integration", included: true },
      { label: "Priority Support", included: true },
      { label: "Image Upload", included: false },
      { label: "Payroll System", included: false },
      { label: "Advanced Analytics", included: false },
      { label: "Custom Branding", included: false }
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
      { label: "Professional Invoice", included: true },
      { label: "Invoice Download", included: true },
      { label: "WhatsApp Integration", included: true },
      { label: "Image Upload", included: true },
      { label: "Payroll System", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Custom Branding", included: true },
      { label: "WhatsApp Direct Support", included: true }
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
  canDownloadInvoice: "standard",
  canUploadImages: "premium",
  canUseWhatsApp: "standard",
  canUsePayroll: "premium",
  canViewAnalytics: "premium",
  canCustomBranding: "premium",
  canManageWorkers: "basic"
} as const;
