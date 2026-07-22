const fs = require('fs');
const glob = require('glob'); // maybe not needed if we hardcode files

const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Staff.tsx',
  'src/pages/QuickOrder.tsx',
  'src/pages/Orders.tsx',
  'src/pages/Customers.tsx',
  'src/pages/PaymentReminders.tsx',
  'src/pages/CustomerDetails.tsx',
  'src/pages/OrderDetails.tsx',
  'src/pages/Settings.tsx',
  'src/components/QuickSetupChecklist.tsx',
  'src/components/Layout.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // We will do some specific replacements
  
  // collection(db, 'shops', user.uid, 'orders') -> query(collection(db, 'orders'), where('userId', '==', user.uid))
  content = content.replace(/collection\(db,\s*'shops',\s*user\!?\.uid,\s*'orders'\)/g, "query(collection(db, 'orders'), where('userId', '==', user.uid))");
  
  // collection(db, 'shops', user.uid, 'customers') -> query(collection(db, 'customers'), where('userId', '==', user.uid))
  content = content.replace(/collection\(db,\s*'shops',\s*user\!?\.uid,\s*'customers'\)/g, "query(collection(db, 'customers'), where('userId', '==', user.uid))");
  
  // collection(db, 'shops', user.uid, 'measurements') -> query(collection(db, 'measurements'), where('userId', '==', user.uid))
  content = content.replace(/collection\(db,\s*'shops',\s*user\!?\.uid,\s*'measurements'\)/g, "query(collection(db, 'measurements'), where('userId', '==', user.uid))");

  // collection(db, 'shops', user.uid, 'payroll') -> query(collection(db, 'payroll'), where('userId', '==', user.uid))
  content = content.replace(/collection\(db,\s*'shops',\s*user\!?\.uid,\s*'payroll'\)/g, "query(collection(db, 'payroll'), where('userId', '==', user.uid))");
  
  // collection(db, 'shops', user.uid, 'payments') -> query(collection(db, 'payments'), where('userId', '==', user.uid))
  content = content.replace(/collection\(db,\s*'shops',\s*user\!?\.uid,\s*'payments'\)/g, "query(collection(db, 'payments'), where('userId', '==', user.uid))");
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Modified', file);
}
