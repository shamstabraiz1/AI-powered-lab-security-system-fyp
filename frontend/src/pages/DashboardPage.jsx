import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { LayoutDashboard } from 'lucide-react';

export const DashboardPage = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard Page"
        subtitle="AI Powered Laboratory Security & Asset Monitoring System"
        icon={LayoutDashboard}
      />
      <Card className="text-center py-12">
        <h3 className="text-lg font-bold text-white font-heading">Dashboard Page</h3>
        <p className="text-xs text-slate-400 mt-2">Department of Software Engineering &bull; AI Powered Security FYP</p>
      </Card>
    </PageContainer>
  );
};
