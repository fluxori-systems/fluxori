'use client';

import { ObservabilityDashboard } from '../../../components/observability';
import { ErrorBoundary } from '../../../components/observability/ErrorBoundary';
import { ApiInterceptor } from '../../../components/observability/ApiInterceptor';

export default function ObservabilityPage() {
  return (
    <ErrorBoundary componentName="ObservabilityPage">
      <ApiInterceptor>
        <ObservabilityDashboard 
          title="Fluxori System Observability" 
          timeRange={{ hours: 6 }}
        />
      </ApiInterceptor>
    </ErrorBoundary>
  );
}