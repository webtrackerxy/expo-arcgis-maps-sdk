import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { CategoryKey } from './screens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Category tile artwork — a two-stop gradient plus a MaterialCommunityIcons
 * glyph, rendered at runtime (see `CategoriesScreen`). Fully original: no
 * bundled images and no third-party map imagery, so the example carries no
 * artwork licensing obligations.
 */
export type CategoryArt = {
  /** Diagonal gradient, top-left → bottom-right. */
  colors: readonly [string, string];
  /** Glyph from `@expo/vector-icons`' MaterialCommunityIcons set. */
  icon: IconName;
};

export const CATEGORY_ART: Record<CategoryKey, CategoryArt> = {
  all: { colors: ['#14B8A6', '#0F766E'], icon: 'view-grid-outline' },
  analysis: { colors: ['#8B5CF6', '#6D28D9'], icon: 'chart-scatter-plot' },
  ar: { colors: ['#FB923C', '#EA580C'], icon: 'cube-scan' },
  cloudPortal: { colors: ['#38BDF8', '#0284C7'], icon: 'cloud-outline' },
  editManage: { colors: ['#34D399', '#059669'], icon: 'pencil-outline' },
  layers: { colors: ['#6366F1', '#4338CA'], icon: 'layers-outline' },
  maps: { colors: ['#3B82F6', '#1E3A8A'], icon: 'map-outline' },
  routing: { colors: ['#FBBF24', '#D97706'], icon: 'map-marker-path' },
  scenes: { colors: ['#A78BFA', '#7C3AED'], icon: 'cube-outline' },
  searchQuery: { colors: ['#22D3EE', '#0891B2'], icon: 'magnify' },
  utility: { colors: ['#64748B', '#334155'], icon: 'transit-connection-variant' },
  visualization: { colors: ['#F472B6', '#DB2777'], icon: 'palette-outline' },
};
