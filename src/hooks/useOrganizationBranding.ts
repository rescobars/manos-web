'use client';

import { useBranding } from '@/hooks/useTheme';

export function useOrganizationBranding() {
  const { branding, updateBranding } = useBranding();
  
  return {
    branding,
    updateBranding,
    logoUrl: branding?.logo_url,
    faviconUrl: branding?.favicon_url,
    primaryFont: branding?.primary_font,
    secondaryFont: branding?.secondary_font,
  };
}
