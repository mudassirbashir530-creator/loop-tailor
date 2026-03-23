import { ArrowLeftRight, ArrowUpDown, Maximize2, Minimize2, CircleDashed, Ruler, Scissors, User, Activity } from 'lucide-react';

export const KAMEEZ_MEASUREMENTS = [
  { id: 'kameezShoulder', label: 'Shoulder', icon: ArrowLeftRight, desc: 'Shoulder to shoulder' },
  { id: 'kameezChest', label: 'Chest', icon: Maximize2, desc: 'Full circumference' },
  { id: 'kameezWaist', label: 'Waist', icon: Minimize2, desc: 'Narrowest part' },
  { id: 'kameezHip', label: 'Hip', icon: Maximize2, desc: 'Widest part' },
  { id: 'kameezLength', label: 'Length', icon: ArrowUpDown, desc: 'Shoulder to hem' },
  { id: 'kameezArmLength', label: 'Arm Length', icon: ArrowUpDown, desc: 'Shoulder to wrist' },
  { id: 'kameezArmWidth', label: 'Arm Width', icon: ArrowLeftRight, desc: 'Bicep circumference' },
  { id: 'kameezCollarSize', label: 'Collar Size', icon: CircleDashed, desc: 'Neck circumference' },
  { id: 'kameezFrontLength', label: 'Front Length', icon: ArrowUpDown, desc: 'Neck to hem (front)' },
  { id: 'kameezBackLength', label: 'Back Length', icon: ArrowUpDown, desc: 'Neck to hem (back)' },
  { id: 'kameezCuffSize', label: 'Cuff Size', icon: CircleDashed, desc: 'Wrist circumference' },
];

export const SHALWAR_MEASUREMENTS = [
  { id: 'shalwarWaist', label: 'Waist', icon: ArrowLeftRight, desc: 'Trouser waist' },
  { id: 'shalwarHip', label: 'Hip', icon: Maximize2, desc: 'Trouser hip' },
  { id: 'shalwarLength', label: 'Length', icon: ArrowUpDown, desc: 'Waist to ankle' },
  { id: 'shalwarBottomWidth', label: 'Bottom Width', icon: ArrowLeftRight, desc: 'Ankle opening' },
  { id: 'shalwarThighWidth', label: 'Thigh Width', icon: ArrowLeftRight, desc: 'Thigh circumference' },
];
