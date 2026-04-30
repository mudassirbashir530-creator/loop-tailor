import fs from 'fs';

const file = 'src/pages/QuickOrder.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
const importReplacement = `import { DesignModal } from '../components/DesignModal';\n`;
content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\n" + importReplacement);

// Add State
const stateToAdd = `
  // Garment Part UI State
  const [activePartModal, setActivePartModal] = useState<string | null>(null);
  const [garmentDesigns, setGarmentDesigns] = useState<Record<string, string>>({
    Collar: 'Classic',
    Sleeves: 'Full',
    Pocket: 'Single',
    Placket: 'Hidden',
    'Half Pk': 'None'
  });
  
  const getOptionsForPart = (part: string) => {
    switch (part) {
      case 'Collar': return [{id: 'Classic', label: 'Classic'}, {id: 'Cutaway', label: 'Cutaway'}, {id: 'Mandarin', label: 'Mandarin'}, {id: 'Button Down', label: 'Button Down'}];
      case 'Sleeves': return [{id: 'Full', label: 'Full Sleeves'}, {id: 'Half', label: 'Half Sleeves'}, {id: 'Roll Up', label: 'Roll Up'}];
      case 'Pocket': return [{id: 'Single', label: 'Single Pocket'}, {id: 'Double', label: 'Double Pockets'}, {id: 'None', label: 'No Pocket'}];
      default: return [{id: 'Option 1', label: 'Option 1'}, {id: 'Option 2', label: 'Option 2'}];
    }
  };
`;

content = content.replace("const [customerData, setCustomerData] = useState({", stateToAdd + "\n  const [customerData, setCustomerData] = useState({");

// Update the Garment Part Options Row
const garmentPartRowRegex = /\{\/\* Garment Part Options Row \*\/\}[\s\S]*?\{\/\* Action Buttons \*\/\}/;

const newGarmentPartRow = `{/* Garment Part Options Row */}
      <div className="px-4 mb-8">
        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
           {[ 
             { label: 'Collar' },
             { label: 'Sleeves' },
             { label: 'Pocket' },
             { label: 'Placket' },
             { label: 'Half Pk' }
           ].map((part, i) => {
             const hasDesign = !!garmentDesigns[part.label];
             return (
             <div key={i} onClick={() => setActivePartModal(part.label)} className="flex flex-col items-center shrink-0 min-w-[72px] cursor-pointer">
               <div className={\`w-[56px] h-[56px] rounded-[16px] flex items-center justify-center mb-2 transition-colors \${hasDesign ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-white text-[#64748B] shadow-[0_2px_12px_rgba(0,0,0,0.07)]'}\`}>
                 <Tag className="w-6 h-6" />
               </div>
               <div className={\`text-[12px] font-medium \${hasDesign ? 'text-[#16A34A]' : 'text-[#64748B]'}\`}>{part.label}</div>
               {hasDesign && <div className="w-8 h-1 bg-[#16A34A] rounded-full mt-1.5"></div>}
             </div>
           )})}
        </div>
      </div>

      {/* Action Buttons */}`;

content = content.replace(garmentPartRowRegex, newGarmentPartRow);

// Inject modal at the end, just inside `</motion.div>`
const modalSnippet = `
      <AnimatePresence>
        {activePartModal && (
          <DesignModal 
            partName={activePartModal}
            options={getOptionsForPart(activePartModal)}
            selectedOption={garmentDesigns[activePartModal] || ''}
            onSelect={(id) => setGarmentDesigns({...garmentDesigns, [activePartModal]: id})}
            onClose={() => setActivePartModal(null)}
            onSave={() => setActivePartModal(null)}
          />
        )}
      </AnimatePresence>
`;

content = content.replace("    </motion.div>\n  );\n}", modalSnippet + "    </motion.div>\n  );\n}");

fs.writeFileSync(file, content);
console.log('Successfully injected Design Modes into base layout');
