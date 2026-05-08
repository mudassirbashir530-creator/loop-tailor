const fs = require('fs');
const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Orders.tsx',
  'src/pages/OrderDetails.tsx',
  'src/pages/QuickOrder.tsx',
  'src/pages/Customers.tsx',
  'src/pages/CustomerDetails.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Login.tsx',
  'src/pages/SignUp.tsx',
  'src/pages/ForgotPassword.tsx',
  'src/pages/Staff.tsx',
  'src/pages/InstallApp.tsx',
  'src/pages/Invoice.tsx',
  'src/pages/Invoices.tsx',
  'src/pages/PaymentReminders.tsx',
  'src/pages/Notifications.tsx',
  'src/pages/Updates.tsx',
  'src/pages/MobileApp.tsx',
  'src/pages/AdminPanel.tsx',
  'src/layouts/AppLayout.tsx',
  'src/components/BottomNav.tsx',
  'src/components/MobileBottomNav.tsx',
  'src/components/Layout.tsx',
  'src/components/PublicLayout.tsx',
  'src/components/MeasurementTemplatesManager.tsx',
  'src/components/OrderTemplates.tsx',
  'src/components/OrderTimeline.tsx',
  'src/components/QuickSetupChecklist.tsx',
  'src/components/NotificationBell.tsx',
  'src/components/OnboardingTour.tsx',
  'src/components/UpdateNotification.tsx',
  'src/components/ErrorBoundary.tsx',
];

files.forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

if (fs.existsSync('src/screens')) {
  fs.rmSync('src/screens', { recursive: true, force: true });
}
console.log('Cleanup done');
