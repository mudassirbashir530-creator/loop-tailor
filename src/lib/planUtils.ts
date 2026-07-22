export function normalizePlanStatus(planName: string | null | undefined): string | null {
  if (!planName) return null;
  const normalized = planName.toLowerCase().replace(/[\s_-]+/g, '');
  switch (normalized) {
    case 'freetrial': return 'free-trial';
    case 'basic': return 'basic';
    case 'standard': return 'standard';
    case 'premium': return 'premium';
    default: return planName.toLowerCase().replace(/[\s_]+/g, '-');
  }
}
