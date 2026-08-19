import { Sparkles, Landmark, Palette, Compass } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', labelKey: 'categoryFilter.all', icon: Sparkles },
  { id: 'public', labelKey: 'categoryFilter.public', icon: Landmark },
  { id: 'cultural', labelKey: 'categoryFilter.cultural', icon: Palette },
  { id: 'astronomical', labelKey: 'categoryFilter.astronomical', icon: Compass }
];

export function matchesCategory(holiday, category) {
  if (!category || category === 'all') return true;
  const type = String(holiday.type || '').toLowerCase();
  const subtype = String(holiday.subtype || '').toLowerCase();
  const name = String(holiday.name || '').toLowerCase();

  if (category === 'public') {
    return type === 'public' || type === 'national' || type.includes('public') || type.includes('national');
  }
  if (category === 'astronomical') {
    return subtype === 'solar-term' || subtype === 'astronomical' || name.includes('equinox') || name.includes('solstice') || subtype.includes('season');
  }
  if (category === 'cultural') {
    return type === 'cultural-observance' || type === 'observance' || type === 'religious' || subtype.includes('cultural') || type.includes('observance') || type.includes('religious');
  }
  return true;
}
