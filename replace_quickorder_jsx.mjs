import fs from 'fs';
import path from 'path';

const file = 'src/pages/QuickOrder.tsx';
let content = fs.readFileSync(file, 'utf8');

const returnStartStr = `return (\n    <div className="space-y-8">`;
let idx = content.indexOf(returnStartStr);

if (idx !== -1) {
    const startStrLen = `return (\n    <div className="space-y-8">`.length;
    
    // We will inject the new UI at the top of QuickOrder
    const injectBlock = `
    <div className="min-h-screen bg-[#F5F7FA] pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F7FA]">
        <button onClick={() => navigate(-1)} type="button" className="p-2">
          <ArrowLeft className="h-6 w-6 text-[#0F172A]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#0F172A]">Customize Order</h1>
        <div className="w-10"></div>
      </div>

      {/* Product Image Area */}
      <div className="px-4 mb-6">
        <div className="w-full h-[320px] bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.07)] relative flex items-center justify-center overflow-hidden">
          {/* Garment Preview Placeholder */}
          <div className="absolute inset-0 bg-[#F1F5F9] flex flex-col items-center justify-center">
             <Scissors className="w-16 h-16 text-[#CBD5E1] mb-4" />
             <span className="text-[#94A3B8] font-medium">Garment Preview</span>
          </div>
          
          {/* Color Swatches */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {[ '#1E293B', '#16A34A', '#94A3B8', '#DC2626' ].map((color, i) => (
              <div key={i} className={\`w-8 h-8 rounded-full shadow-md cursor-pointer border-2 \${i === 1 ? 'border-white scale-110' : 'border-transparent'}\`} style={{ backgroundColor: color }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Price + View Button Row */}
      <div className="px-4 mb-6 flex justify-between items-center">
        <div className="text-[20px] font-bold text-[#16A34A]">$140.00</div>
        <button type="button" className="bg-[#16A34A] text-white px-6 py-2 rounded-full text-[14px] font-semibold shadow-sm">
          View Details
        </button>
      </div>

      {/* Garment Part Options Row */}
      <div className="px-4 mb-8">
        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
           {[ 
             { label: 'Collar', active: true },
             { label: 'Sleeves', active: false },
             { label: 'Pocket', active: false },
             { label: 'Placket', active: false },
             { label: 'Half Placket', active: false }
           ].map((part, i) => (
             <div key={i} className="flex flex-col items-center shrink-0 min-w-[72px] cursor-pointer">
               <div className={\`w-[56px] h-[56px] rounded-[16px] flex items-center justify-center mb-2 \${part.active ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-white text-[#64748B] shadow-[0_2px_12px_rgba(0,0,0,0.07)]'}\`}>
                 <Tag className="w-6 h-6" />
               </div>
               <div className={\`text-[12px] font-medium \${part.active ? 'text-[#16A34A]' : 'text-[#64748B]'}\`}>{part.label}</div>
               {part.active && <div className="w-8 h-1 bg-[#16A34A] rounded-full mt-1.5"></div>}
             </div>
           ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mb-10 space-y-3">
        <div className="flex gap-3">
          <button type="button" className="flex-1 bg-[#16A34A] text-white h-12 rounded-full font-semibold text-[15px] shadow-sm flex items-center justify-center gap-2">
            <Upload className="w-4 h-4"/> Upload Design
          </button>
          <button type="button" className="flex-1 bg-white border-2 border-[#16A34A] text-[#16A34A] h-12 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2">
            <Phone className="w-4 h-4"/> Call Customer
          </button>
        </div>
        <div className="flex gap-3">
          <button type="button" className="w-1/3 bg-transparent border border-[#E2E8F0] text-[#64748B] h-12 rounded-full font-semibold text-[15px]">
            Save Draft
          </button>
          <button onClick={() => {
            const form = document.getElementById('quick-order-form');
            if (form) form.requestSubmit();
          }} type="button" disabled={isSubmitting} className="w-2/3 bg-[#16A34A] text-white h-12 rounded-full font-bold text-[15px] shadow-sm">
            {isSubmitting ? 'Confirming...' : 'Confirm Order'}
          </button>
        </div>
      </div>
      
      {/* Original Form (Scrollable) */}
      <div className="px-4 bg-white rounded-t-[32px] pt-8 pb-10 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <h3 className="text-[18px] font-bold text-[#0F172A] mb-6">Customer & Measurements</h3>
        <div>
    `;
    
    // We need to inject this and wrap the rest.
    // However, QuickOrder is highly complex and has many internal divs that might get messed up.
    // It's safer to just replace `return (\n    <div className="space-y-8">` with our block.
    // Wait, the rest of the code is `<motion.div ... ` etc.
    // Let's close our `<div>` at the very end of the file.
} else {
    console.log("Not found block 1");
}

let idx2 = content.lastIndexOf(`</div>\n  );\n}`);
if (idx2 !== -1 && idx !== -1) {
   let newContent = content.slice(0, idx) + `return (\n` + injectBlock + content.slice(idx + `return (\n    <div className="space-y-8">`.length, idx2) + `</div></div></div>\n  );\n}`;
   
   // Ensure we add an id="quick-order-form" to the existing form inside QuickOrder.
   // Replace `<form onSubmit={handleSubmit}` with `<form id="quick-order-form" onSubmit={handleSubmit}`
   newContent = newContent.replace('<form onSubmit={handleSubmit}', '<form id="quick-order-form" onSubmit={handleSubmit}');
   fs.writeFileSync(file, newContent);
   console.log("Successfully replaced quickorder");
} else {
   console.log("Cannot find end block");
}
