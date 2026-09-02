import { Sparkles, Landmark, Palette, Compass } from 'lucide-react';
import type { ComponentType } from 'react';
import { getHolidayType } from './holidayColors';
import type { HolidayCategory, HolidayLike, HolidayType, RequestScope } from '../types';

interface CategoryDefinition {
  id: HolidayCategory;
  labelKey: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const CATEGORIES: CategoryDefinition[] = [
  { id: 'all', labelKey: 'categoryFilter.all', icon: Sparkles },
  { id: 'public', labelKey: 'categoryFilter.public', icon: Landmark },
  { id: 'cultural', labelKey: 'categoryFilter.cultural', icon: Palette },
  { id: 'astronomical', labelKey: 'categoryFilter.astronomical', icon: Compass }
];

// Which canonical holiday types each filter chip covers.
const CATEGORY_TYPES: Partial<Record<HolidayCategory, HolidayType[]>> = {
  public: ['public'],
  cultural: ['cultural', 'religious', 'observance'],
  astronomical: ['seasonal']
};

/**
 * Categories beyond `public` need the extended payload from the API; the
 * default `public` scope alone cannot satisfy them.
 */
export function getScopeForCategory(category: string | undefined): RequestScope {
  return category === 'public' ? 'public' : 'all';
}

export function matchesCategory(holiday: HolidayLike, category: string | undefined): boolean {
  if (!category || category === 'all') return true;

  const types = CATEGORY_TYPES[category as HolidayCategory];
  if (!types) return true;

  return types.includes(getHolidayType(holiday));
}
