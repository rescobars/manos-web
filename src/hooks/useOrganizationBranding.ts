'use client';

import { useDynamicTheme } from '@/contexts/DynamicThemeContext';

export function useOrganizationBranding() {
  const { branding, updateBranding } = useDynamicTheme();
  
  return {
    branding,
    updateBranding,
    logoUrl: branding?.logo_url,
    faviconUrl: branding?.favicon_url,
    primaryFont: branding?.primary_font,
    secondaryFont: branding?.secondary_font,
  };
}
