'use client';

import React from 'react';
import { Page } from '@/components/ui';
import { LiveTrackingComponent } from '@/components/tracking/LiveTrackingComponent';

export default function LiveTrackingPage() {
  return (
    <Page title="Seguimiento en Vivo">
      <LiveTrackingComponent />
    </Page>
  );
}
