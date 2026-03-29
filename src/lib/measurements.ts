import { ArrowLeftRight, ArrowUpDown, Maximize2, Minimize2, CircleDashed, Ruler, Scissors, User, Activity } from 'lucide-react';

export const KAMEEZ_MEASUREMENTS = [
  { id: 'kameezShoulder', en: 'Shoulder', ur: 'کندھا', icon: ArrowLeftRight, desc: 'Shoulder to shoulder' },
  { id: 'kameezChest', en: 'Chest', ur: 'چھاتی', icon: Maximize2, desc: 'Full circumference' },
  { id: 'kameezWaist', en: 'Waist', ur: 'کمر', icon: Minimize2, desc: 'Narrowest part' },
  { id: 'kameezHip', en: 'Hip', ur: 'ہپ', icon: Maximize2, desc: 'Widest part' },
  { id: 'kameezLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Shoulder to hem' },
  { id: 'kameezArmLength', en: 'Arm Length', ur: 'بازو کی لمبائی', icon: ArrowUpDown, desc: 'Shoulder to wrist' },
  { id: 'kameezArmWidth', en: 'Arm Width', ur: 'بازو کی چوڑائی', icon: ArrowLeftRight, desc: 'Bicep circumference' },
  { id: 'kameezCollarSize', en: 'Collar Size', ur: 'کالر کا سائز', icon: CircleDashed, desc: 'Neck circumference' },
  { id: 'kameezFrontLength', en: 'Front Length', ur: 'سامنے کی لمبائی', icon: ArrowUpDown, desc: 'Neck to hem (front)' },
  { id: 'kameezBackLength', en: 'Back Length', ur: 'پچھلی لمبائی', icon: ArrowUpDown, desc: 'Neck to hem (back)' },
  { id: 'kameezCuffSize', en: 'Cuff Size', ur: 'کف کا سائز', icon: CircleDashed, desc: 'Wrist circumference' },
];

export const SHALWAR_MEASUREMENTS = [
  { id: 'shalwarWaist', en: 'Waist', ur: 'کمر', icon: ArrowLeftRight, desc: 'Trouser waist' },
  { id: 'shalwarHip', en: 'Hip', ur: 'ہپ', icon: Maximize2, desc: 'Trouser hip' },
  { id: 'shalwarLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Waist to ankle' },
  { id: 'shalwarBottomWidth', en: 'Bottom Width', ur: 'پانچہ', icon: ArrowLeftRight, desc: 'Ankle opening' },
  { id: 'shalwarThighWidth', en: 'Thigh Width', ur: 'تھائی', icon: ArrowLeftRight, desc: 'Thigh circumference' },
];
