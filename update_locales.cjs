const fs = require('fs');

const updateTranslations = () => {
  const enPath = 'src/locales/en.json';
  const urPath = 'src/locales/ur.json';
  
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const ur = JSON.parse(fs.readFileSync(urPath, 'utf8'));

  // Create exact match replacer
  const exactEnMap = {
    "Invoice": "Bill",
    "Customer Directory": "My Customers",
    "Measurement Template": "Saved Sizes",
    "Measurement Templates": "Saved Body Sizes",
    "Order Status": "Order Progress",
    "Pending Payment": "Money to Collect",
    "Pending Payments": "Money to Collect",
    "Revenue": "Total Earned",
    "Completed Orders": "Done Orders",
    "Active Orders": "Orders in Progress",
    "Token ID": "Order Number",
    "Token": "Token",
    "Configure": "Set Up",
    "Interface Language": "App Language",
    "WhatsApp Alerts": "WhatsApp Messages",
    "Inactive": "Old",
    "Active": "Regular",
    "Add Customer": "+ New Customer",
    "Order Details": "Order Info",
    "Delivery Date": "Ready By",
    
    // Bottom Bar
    "Home": "Home",
    "Clients": "My Customers",
    "Orders": "My Orders",
    "More": "Settings",
    
    // DASHBOARD
    "Welcome back": "Hello", 
    "Here's what's happening today.": "Here is your work today.",
    "Search by Token ID (e.g. 101)": "Search Order Number",
    "ACTIVE ORDERS": "Orders in Progress",
    "COMPLETED ORDERS": "Done Orders",
    "PENDING PAYMENTS": "Money to Collect",
    "REVENUE": "Total Earned",
    "AVERAGE ORDER VALUE": "Each Order Worth",
    "ORDERS GROWTH": "New vs Old Orders",
    "NEW CUSTOMERS": "New Customers",
    "Based on delivered orders": "From delivered orders only",
    "Added this month": "Joined this month",
    "Revenue (Last 6 Months)": "Money Earned — Last 6 Months",
    "vs 0": "vs last month",
    
    // CUSTOMER DIRECTORY
    "Manage your client profiles and measurement history.": "See all your customers and their sizes.",
    "Search by name or phone...": "Search name or number",
    "All Clients": "All",
    "All Orders": "All",
    
    // NEW ORDER FORM
    "CUSTOMER INFO": "Step 1: Customer",
    "ORDER DETAILS": "Step 2: Order Info",
    "MEASUREMENTS": "Step 3: Sizes",
    "REVIEW": "Step 4: Check & Save",
    
    "Customer Information": "About the Customer",
    "SEARCH EXISTING CUSTOMER": "Find Saved Customer",
    "Search Existing Customer": "Find Saved Customer",
    "CUSTOMER NAME *": "Customer Name",
    "Customer Name *": "Customer Name",
    "Enter customer name": "Write full name",
    "PHONE NUMBER": "Phone Number",
    "Enter phone number": "Write phone number",
    "Male": "Gents",
    "Female": "Ladies",
    "Kids": "Children",
    "ADDRESS": "Home Address (optional)",
    "Address": "Home Address (optional)",
    "Enter address": "Write address if needed",
    "Next": "Next Step →",
    
    // Order Details Section
    "Garment Type": "What to Make?",
    "Dress Type": "What to Make?",
    "Dress Type *": "What to Make?",
    "Delivery Date *": "Ready By",
    "Price (PKR)": "Price in Rupees",
    "Total Price *": "Price in Rupees",
    "Total Price": "Price in Rupees",
    "Notes / Special Instructions": "Extra Instructions",
    "Notes": "Extra Instructions",
    "Write any special instructions": "Write any special note",
    "Select delivery date": "Tap to choose date",
    
    // Measurements Section
    "Measurements (Inches)": "Body Sizes / Stitching Sizes",
    "Measurements": "Body Sizes / Stitching Sizes",
    "No templates saved yet": "No saved sizes yet",
    "Save as template": "Save these sizes",
    "Load from template": "Use saved sizes",
    "Chest": "Seena (Chest)",
    "Waist": "Kamar (Waist)",
    "Hips": "Hips",
    "Shoulder": "Kandha (Shoulder)",
    "Sleeve Length": "Sleeve Length",
    "Shirt Length": "Shirt Length",
    "Neck": "Neck Size",
    
    // Review Section
    "Review": "Check Before Saving",
    "Order Summary": "Your Order Details",
    "Edit": "Change",
    "Confirm & Save": "Save Order ✓",
    "Back": "Go Back",
    "Save Order": "Save Order ✓",
    
    // ORDER LIST / HISTORY
    "My Orders": "My Orders",
    "Order Tracking": "My Orders",
    "Manage and track your customer orders in real-time.": "Track your customer orders.",
    "Pending": "Not Started",
    "In Progress": "Being Made",
    "Ready": "Ready to Give",
    "Delivered": "Given to Customer",
    "Cancelled": "Cancelled",
    "Overdue": "Late — Past Due Date",
    "View Details": "See Full Order",
    "Details": "See Full Order",
    "Mark as Ready": "Mark Ready",
    "Mark as Delivered": "Mark Delivered",
    "Mark as Paid": "Paid ✓",
    "Payment Received": "Money Received",
    "Payment Pending": "Money Not Received",
    "Amount Due": "Money to Collect",
    "Advance Paid": "Advance Paid",
    "Advance": "Advance",
    "Balance Due": "Money to Collect",
    
    // SHOP SETTINGS
    "Shop Settings": "My Shop Settings",
    "Manage your tailor shop details and invoice preferences.": "Set up your shop info and bill details.",
    "Shop Profile": "My Shop Info",
    "Edit Profile": "Edit",
    "Shop Logo": "Shop Logo / Photo",
    "Shop Name": "Shop Name",
    "Phone Number *": "Phone Number",
    "Invoice Footer Message": "Message on Bill",
    "WhatsApp Alerts": "WhatsApp Messages",
    "Enabled": "On ✓",
    "Disabled": "Off",
    "Order Templates": "Saved Order Formats",
    "No templates saved yet. Save templates from the Quick Order form.": "No saved formats yet. You can save a format while making an order.",
    "Select your preferred language": "Choose your language",
    "Custom measurement fields for different genders.": "Saved stitching sizes for Gents, Ladies, and Children.",
    "New Template": "+ Add New Sizes",
    
    // BUTTONS
    "Save": "Save",
    "Save Changes": "Save Changes",
    "Cancel": "Cancel",
    "Delete": "Remove",
    "Confirm": "Yes, Confirm",
    "Submit": "Send",
    "Update": "Update",
    "Close": "Close",
    "Done": "Done ✓",
    "Add": "Add",
    "Remove": "Remove",
    "Search": "Search",
    "Filter": "Filter",
    "Sort": "Sort",
    "See All": "See All",
    "View All": "See All",
    "Return to login": "Go Back",
    "Previous": "Back",
    "Skip": "Skip",
    "Try Again": "Try Again",
    
    // MESSAGES
    "This field is required": "Please fill this",
    "Invalid phone number": "Phone number is wrong",
    "Network error. Please try again.": "No internet. Please check your connection.",
    "Something went wrong": "Something went wrong. Try again.",
    "No results found": "Nothing found",
    "Session expired. Please log in again.": "Please log in again.",
    
    // SUCCESS
    "Order created successfully": "Order Saved! ✓",
    "Customer added successfully": "New Customer Added ✓",
    "Order updated": "Changes Saved ✓",
    "Payment recorded": "Payment Saved ✓",
    "Status updated": "Status Changed ✓",
    "Profile updated": "Shop Info Updated ✓",
    "Template saved": "Sizes Saved ✓",
    "Saved Successfully": "Sizes Saved ✓",
    "Deleted successfully": "Removed ✓",
    
    // EMPTY STATES
    "No orders yet": "No orders yet",
    "No orders found": "No orders yet",
    "No customers found": "No customers yet",
    "No templates saved yet": "No saved sizes yet",
    "No results match your search": "Nothing found for this search",
    "No pending payments": "All payments received ✓",
    
    // STATUS
    "Received": "Order Received",
    "Ready for Pickup": "Ready — Come Collect",
    "Out for Delivery": "On the Way",
    
    // TITLES
    "New Order": "New Order",
    "Customer Profile": "Customer Details",
    "Edit Order": "Edit Order",
    "Edit Customer": "Edit Customer"
  };

  const exactUrMap = {
    // BOTTOM BAR
    "Home": "ہوم",
    "Clients": "میرے گاہک",
    "Orders": "آرڈر",
    "More": "سیٹنگ",
    
    // DASHBOARD
    "Hello": "ہیلو",
    "Here is your work today.": "آج کا کام یہ ہے۔",
    "Search Order Number": "آرڈر نمبر ڈھونڈیں",
    "Orders in Progress": "چل رہے آرڈر",
    "Done Orders": "مکمل آرڈر",
    "Money to Collect": "لینے والے پیسے",
    "Total Earned": "کل کمائی",
    "Each Order Worth": "ہر آرڈر کی قیمت",
    "New vs Old Orders": "نئے بمقابلہ پرانے آرڈر",
    "New Customers": "نئے گاہک",
    "From delivered orders only": "صرف ڈلیوری شدہ آرڈر سے",
    "Joined this month": "اس مہینے آئے",
    "Money Earned — Last 6 Months": "پچھلے 6 مہینے کی کمائی",
    "Order Progress": "آرڈر کی حالت",
    "vs last month": "گزشتہ مہینے سے",
    
    // CUSTOMERS
    "My Customers": "میرے گاہک",
    "See all your customers and their sizes.": "اپنے تمام گاہکوں کو یہاں دیکھیں۔",
    "Search name or number": "نام یا نمبر سے ڈھونڈیں",
    "+ New Customer": "+ نیا گاہک",
    "All": "سب",
    "Regular": "پکے گاہک",
    "Old": "پرانے",
    
    // NEW ORDER
    "Step 1: Customer": "مرحلہ 1: گاہک",
    "Step 2: Order Info": "مرحلہ 2: آرڈر",
    "Step 3: Sizes": "مرحلہ 3: ناپ",
    "Step 4: Check & Save": "مرحلہ 4: دیکھو اور محفوظ کرو",
    
    "About the Customer": "گاہک کی معلومات",
    "Find Saved Customer": "پرانا گاہک ڈھونڈیں",
    "Write full name": "پورا نام لکھیں",
    "Phone Number": "فون نمبر",
    "Write phone number": "فون نمبر لکھیں",
    "Gents": "گینٹس",
    "Ladies": "لیڈیز",
    "Children": "بچے",
    "Home Address (optional)": "گھر کا پتہ (ضروری نہیں)",
    "Write address if needed": "پتہ لکھیں اگر ضروری ہو",
    "Next Step →": "اگلا مرحلہ →",
    
    "Order Info": "آرڈر کی تفصیل",
    "What to Make?": "کیا بنانا ہے؟",
    "Ready By": "کب تیار چاہیے؟",
    "Price in Rupees": "قیمت (روپے میں)",
    "Extra Instructions": "خاص ہدایات",
    "Write any special note": "کوئی خاص بات لکھیں",
    "Tap to choose date": "تاریخ چنیں",
    
    "Body Sizes / Stitching Sizes": "ناپ",
    "No saved sizes yet": "ابھی کوئی ناپ محفوظ نہیں",
    "Save these sizes": "یہ ناپ محفوظ کریں",
    "Use saved sizes": "پرانا ناپ استعمال کریں",
    "Seena (Chest)": "سینہ",
    "Kamar (Waist)": "کمر",
    "Hips": "کولہے",
    "Kandha (Shoulder)": "کندھا",
    "Sleeve Length": "آستین کی لمبائی",
    "Shirt Length": "قمیض کی لمبائی",
    "Neck Size": "گلے کا ناپ",
    "inch": "انچ",
    
    "Check Before Saving": "محفوظ کرنے سے پہلے دیکھیں",
    "Your Order Details": "آپ کا آرڈر",
    "Change": "بدلیں",
    "Save Order ✓": "آرڈر محفوظ کریں ✓",
    "Go Back": "واپس جائیں",
    
    // ORDERS
    "My Orders": "میرے آرڈر",
    "Not Started": "شروع نہیں",
    "Being Made": "بن رہا ہے",
    "Ready to Give": "دینے کے لیے تیار",
    "Given to Customer": "گاہک کو دے دیا",
    "Cancelled": "بند",
    "Late — Past Due Date": "دیر ہو گئی",
    "See Full Order": "پورا آرڈر دیکھیں",
    "Mark Ready": "تیار کا نشان لگائیں",
    "Mark Delivered": "ڈلیوری ہو گئی",
    "Paid ✓": "پیسے مل گئے ✓",
    "Money Received": "پیسے آ گئے",
    "Money Not Received": "پیسے نہیں آئے",
    
    // SETTINGS
    "My Shop Settings": "میری دکان کی سیٹنگ",
    "Set up your shop info and bill details.": "اپنی دکان کی معلومات اور بل ترتیب دیں۔",
    "My Shop Info": "میری دکان",
    "Shop Logo / Photo": "دکان کی تصویر",
    "Shop Name": "دکان کا نام",
    "Shop Address": "دکان کا پتہ",
    "Message on Bill": "بل کے نیچے لکھائی",
    "WhatsApp Messages": "واٹس ایپ میسج",
    "On ✓": "آن ✓",
    "Off": "آف",
    "Saved Order Formats": "محفوظ آرڈر فارمیٹ",
    "No saved formats yet. You can save a format while making an order.": "ابھی کوئی فارمیٹ نہیں۔ آرڈر بناتے وقت محفوظ کر سکتے ہیں۔",
    "App Language": "ایپ کی زبان",
    "Choose your language": "اپنی زبان چنیں",
    "Saved Body Sizes": "محفوظ ناپ",
    "Saved stitching sizes for Gents, Ladies, and Children.": "گینٹس، لیڈیز اور بچوں کے محفوظ ناپ۔",
    "+ Add New Sizes": "+ نئے ناپ شامل کریں",
    
    // BUTTONS
    "Save": "محفوظ کریں",
    "Save Changes": "تبدیلی محفوظ کریں",
    "Cancel": "واپس",
    "Remove": "ہٹا دیں",
    "Yes, Confirm": "ہاں، تصدیق",
    "Send": "بھیجیں",
    "Update": "اپ ڈیٹ کریں",
    "Close": "بند کریں",
    "Done ✓": "ہو گیا ✓",
    "Add": "شامل کریں",
    "Search": "ڈھونڈیں",
    "Filter": "فلٹر",
    "Sort": "ترتیب",
    "See All": "سب دیکھیں",
    "See More": "مزید دیکھیں",
    "Next": "آگے",
    "Back": "پیچھے",
    "Skip": "چھوڑیں",
    "Try Again": "دوبارہ کوشش",
    
    // MESSAGES
    "Please fill this": "یہ ضروری ہے",
    "Phone number is wrong": "فون نمبر غلط ہے",
    "No internet. Please check your connection.": "انٹرنیٹ نہیں ہے۔ کنکشن چیک کریں۔",
    "Something went wrong. Try again.": "کچھ غلط ہوا۔ دوبارہ کوشش کریں۔",
    "Nothing found": "کچھ نہیں ملا",
    "Please log in again.": "دوبارہ لاگ ان کریں۔",
    
    "Order Saved! ✓": "آرڈر محفوظ ہو گیا! ✓",
    "New Customer Added ✓": "نیا گاہک شامل ہو گیا ✓",
    "Changes Saved ✓": "تبدیلی محفوظ ✓",
    "Payment Saved ✓": "ادائیگی درج ✓",
    "Status Changed ✓": "حالت بدل گئی ✓",
    "Shop Info Updated ✓": "دکان کی معلومات اپ ڈیٹ ✓",
    "Sizes Saved ✓": "ناپ محفوظ ✓",
    "Removed ✓": "ہٹا دیا گیا ✓",
    
    "No orders yet": "ابھی کوئی آرڈر نہیں",
    "No customers yet": "ابھی کوئی گاہک نہیں",
    "No saved sizes yet": "کوئی ناپ محفوظ نہیں",
    "Nothing found for this search": "اس نام سے کچھ نہیں ملا",
    "All payments received ✓": "سب پیسے مل گئے ✓",
    
    "Order Received": "آرڈر آ گیا",
    "Being Stitched": "سلائی ہو رہی ہے",
    "Ready — Come Collect": "تیار — لے جائیں",
    "On the Way": "جا رہا ہے",
    "Delivered ✓": "ڈلیوری ہو گئی ✓",
    
    "New Order": "نیا آرڈر",
    "Settings": "سیٹنگ",
    "All Orders": "تمام آرڈر",
    "Customer Details": "گاہک کی تفصیل",
    "Edit Order": "آرڈر بدلیں",
    "Edit Customer": "گاہک کی معلومات بدلیں",
    "Stitching Sizes": "ناپ کی تفصیل",
    "Bill": "بل"
  };

  const walkAndReplace = (obj, map) => {
    for (let k in obj) {
      if (typeof obj[k] === 'string') {
        const orig = obj[k];
        if (map[orig]) {
            obj[k] = map[orig];
        } else {
            // Check substrings or other logic
            let modified = false;
            let current = orig;
            for(let [key, val] of Object.entries(map)) {
                if(current === key) {
                    current = val;
                    modified = true;
                    break;
                }
            }
            if (!modified) {
              // try making it simple anyway
              let lowered = current.toLowerCase();
              if (lowered === 'invoice') current = "Bill";
              if (lowered === 'invoices') current = "Bills";
              if (lowered.includes('configure')) current = current.replace(/configure/ig, 'Set Up');
            }
            obj[k] = current;
        }
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        walkAndReplace(obj[k], map);
      }
    }
  };

  walkAndReplace(en, exactEnMap);
  
  const syncUr = (enObj, urObj) => {
      for (let k in enObj) {
          if (typeof enObj[k] === 'string') {
              let simpleEnString = enObj[k];
              if (exactUrMap[simpleEnString]) {
                  urObj[k] = exactUrMap[simpleEnString];
              }
          } else if (typeof enObj[k] === 'object' && enObj[k] !== null) {
              if(!urObj[k]) urObj[k] = {};
              syncUr(enObj[k], urObj[k]);
          }
      }
  };
  
  syncUr(en, ur);

  // Manual fixes
  ur.dashboard.pendingPayments = "لینے والے پیسے";
  ur.dashboard.revenue = "کل کمائی";
  en.dashboard.pendingPayments = "Money to Collect";
  en.dashboard.revenue = "Total Earned";
  en.layout.dashboard = "Home";
  en.layout.customers = "My Customers";
  en.layout.orders = "Orders";
  en.layout.settings = "Settings";
  ur.layout.dashboard = "ہوم";
  ur.layout.customers = "میرے گاہک";
  ur.layout.orders = "آرڈر";
  ur.layout.settings = "سیٹنگ";

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(urPath, JSON.stringify(ur, null, 2));
};

updateTranslations();
console.log("Locales updated!");
