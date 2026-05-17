import { ArrowLeftRight, ArrowUpDown, Maximize2, Minimize2, CircleDashed, Ruler, Scissors, User, Activity, Info } from 'lucide-react';

export const MEASUREMENT_SETS = ['Shalwar Kameez', 'Formal Suit', 'Casual Shirt', 'Wedding Sherwani', 'Custom'];

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
  { id: 'damanDesign', en: 'Daman Design', ur: 'دامن ڈیزائن', icon: Info, desc: 'Daman design details' },
  { id: 'collarStyle', en: 'Collar Style', ur: 'کالر کا اسٹائل', icon: Info, desc: 'Collar style details' },
  { id: 'sidePocket', en: 'Side Pocket', ur: 'سائیڈ پاکٹ', icon: Info, desc: 'Side pocket details' },
  { id: 'pocketStyle', en: 'Pocket Style', ur: 'پاکٹ اسٹائل', icon: Info, desc: 'Pocket style details' },
  { id: 'sleeveStyle', en: 'Sleeve Style', ur: 'آستین کا اسٹائل', icon: Info, desc: 'Sleeve style details' },
  { id: 'backDesign', en: 'Back Design', ur: 'بیک ڈیزائن', icon: Info, desc: 'Back design details' },
  { id: 'finishingType', en: 'Finishing Type', ur: 'فنیشنگ کی قسم', icon: Info, desc: 'Finishing type details' },
  { id: 'specialInstructions', en: 'Special Instructions', ur: 'خصوصی ہدایات', icon: Info, desc: 'Any special instructions' },
];

export const SHALWAR_MEASUREMENTS = [
  { id: 'shalwarWaist', en: 'Waist', ur: 'کمر', icon: ArrowLeftRight, desc: 'Trouser waist' },
  { id: 'shalwarHip', en: 'Hip', ur: 'ہپ', icon: Maximize2, desc: 'Trouser hip' },
  { id: 'shalwarLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Waist to ankle' },
  { id: 'shalwarBottomWidth', en: 'Bottom Width', ur: 'پانچہ', icon: ArrowLeftRight, desc: 'Ankle opening' },
  { id: 'shalwarThighWidth', en: 'Thigh Width', ur: 'تھائی', icon: ArrowLeftRight, desc: 'Thigh circumference' },
];

export const PANTS_MEASUREMENTS = [
  { id: 'pantsWaist', en: 'Waist', ur: 'کمر', icon: ArrowLeftRight, desc: 'Trouser waist' },
  { id: 'pantsHip', en: 'Hip', ur: 'ہپ', icon: Maximize2, desc: 'Trouser hip' },
  { id: 'pantsLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Waist to ankle' },
  { id: 'pantsBottomWidth', en: 'Bottom Width', ur: 'پانچہ', icon: ArrowLeftRight, desc: 'Ankle opening' },
  { id: 'pantsThighWidth', en: 'Thigh Width', ur: 'تھائی', icon: ArrowLeftRight, desc: 'Thigh circumference' },
  { id: 'pantsInseam', en: 'Inseam', ur: 'اندرونی لمبائی', icon: ArrowUpDown, desc: 'Crotch to ankle' },
];

export const SHIRT_MEASUREMENTS = [
  { id: 'shirtShoulder', en: 'Shoulder', ur: 'کندھا', icon: ArrowLeftRight, desc: 'Shoulder to shoulder' },
  { id: 'shirtChest', en: 'Chest', ur: 'چھاتی', icon: Maximize2, desc: 'Full circumference' },
  { id: 'shirtWaist', en: 'Waist', ur: 'کمر', icon: Minimize2, desc: 'Narrowest part' },
  { id: 'shirtLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Shoulder to hem' },
  { id: 'shirtArmLength', en: 'Arm Length', ur: 'بازو کی لمبائی', icon: ArrowUpDown, desc: 'Shoulder to wrist' },
  { id: 'shirtCollarSize', en: 'Collar Size', ur: 'کالر کا سائز', icon: CircleDashed, desc: 'Neck circumference' },
];

export const WAISTCOAT_MEASUREMENTS = [
  { id: 'waistcoatShoulder', en: 'Shoulder', ur: 'کندھا', icon: ArrowLeftRight, desc: 'Shoulder to shoulder' },
  { id: 'waistcoatChest', en: 'Chest', ur: 'چھاتی', icon: Maximize2, desc: 'Full circumference' },
  { id: 'waistcoatWaist', en: 'Waist', ur: 'کمر', icon: Minimize2, desc: 'Narrowest part' },
  { id: 'waistcoatLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Shoulder to hem' },
];

export const FROCK_MEASUREMENTS = [
  { id: 'frockShoulder', en: 'Shoulder', ur: 'کندھا', icon: ArrowLeftRight, desc: 'Shoulder to shoulder' },
  { id: 'frockChest', en: 'Chest', ur: 'چھاتی', icon: Maximize2, desc: 'Full circumference' },
  { id: 'frockWaist', en: 'Waist', ur: 'کمر', icon: Minimize2, desc: 'Narrowest part' },
  { id: 'frockLength', en: 'Length', ur: 'لمبائی', icon: ArrowUpDown, desc: 'Shoulder to hem' },
  { id: 'frockFlare', en: 'Flare', ur: 'گھیر', icon: ArrowLeftRight, desc: 'Bottom flare' },
];

export const ALL_MEASUREMENTS = [
  ...KAMEEZ_MEASUREMENTS,
  ...SHALWAR_MEASUREMENTS,
  ...PANTS_MEASUREMENTS,
  ...SHIRT_MEASUREMENTS,
  ...WAISTCOAT_MEASUREMENTS,
  ...FROCK_MEASUREMENTS,
];

export const getMeasurementName = (key: string, isRTL: boolean) => {
  const measurement = ALL_MEASUREMENTS.find(m => m.id === key);
  if (measurement) {
    return isRTL ? measurement.ur : measurement.en;
  }
  return key;
};

export const getAllMeasurementCategories = () => {
  return [
    { id: 'kameez', titleEn: 'Top / Kameez', titleUr: 'قمیض', items: KAMEEZ_MEASUREMENTS },
    { id: 'shalwar', titleEn: 'Bottom / Shalwar', titleUr: 'شلوار', items: SHALWAR_MEASUREMENTS },
    { id: 'pants', titleEn: 'Pants', titleUr: 'پینٹ', items: PANTS_MEASUREMENTS },
    { id: 'shirt', titleEn: 'Shirt', titleUr: 'شرٹ', items: SHIRT_MEASUREMENTS },
    { id: 'waistcoat', titleEn: 'Waistcoat', titleUr: 'واسکٹ', items: WAISTCOAT_MEASUREMENTS },
    { id: 'frock', titleEn: 'Frock / Maxi', titleUr: 'فراک / میکسی', items: FROCK_MEASUREMENTS },
  ];
};

export const getMeasurementCategoriesForDress = (dressType: string) => {
  const type = dressType.toLowerCase();
  const categories = [];

  if (type.includes('shalwar kameez') || type.includes('kurta pajama') || type.includes('suit') || type.includes('sherwani')) {
    categories.push({ id: 'kameez', titleEn: 'Top / Kameez', titleUr: 'قمیض', items: KAMEEZ_MEASUREMENTS });
    categories.push({ id: 'shalwar', titleEn: 'Bottom / Shalwar', titleUr: 'شلوار', items: SHALWAR_MEASUREMENTS });
  } else if (type.includes('pants + shirt') || type.includes('pant shirt')) {
    categories.push({ id: 'shirt', titleEn: 'Shirt', titleUr: 'شرٹ', items: SHIRT_MEASUREMENTS });
    categories.push({ id: 'pants', titleEn: 'Pants', titleUr: 'پینٹ', items: PANTS_MEASUREMENTS });
  } else if (type.includes('waistcoat')) {
    categories.push({ id: 'waistcoat', titleEn: 'Waistcoat', titleUr: 'واسکٹ', items: WAISTCOAT_MEASUREMENTS });
  } else if (type.includes('frock') || type.includes('maxi') || type.includes('bridal') || type.includes('lehenga') || type.includes('gharara')) {
    categories.push({ id: 'frock', titleEn: 'Top / Frock', titleUr: 'فراک / قمیض', items: FROCK_MEASUREMENTS });
    categories.push({ id: 'shalwar', titleEn: 'Bottom', titleUr: 'شلوار / لہنگا', items: SHALWAR_MEASUREMENTS });
  } else if (type.includes('kameez') || type.includes('kurti') || type.includes('kurta')) {
    categories.push({ id: 'kameez', titleEn: 'Kameez / Kurti', titleUr: 'قمیض', items: KAMEEZ_MEASUREMENTS });
  } else if (type.includes('shalwar') || type.includes('trouser') || type.includes('pants')) {
    categories.push({ id: 'pants', titleEn: 'Bottom / Pants', titleUr: 'شلوار / پینٹ', items: PANTS_MEASUREMENTS });
  } else {
    // Default fallback
    categories.push({ id: 'kameez', titleEn: 'Top', titleUr: 'قمیض', items: KAMEEZ_MEASUREMENTS });
    categories.push({ id: 'shalwar', titleEn: 'Bottom', titleUr: 'شلوار', items: SHALWAR_MEASUREMENTS });
  }

  const allItems: any[] = [];
  categories.forEach(c => {
    c.items.forEach(item => allItems.push({ ...item, categoryId: c.id }));
  });

  return allItems;
};
