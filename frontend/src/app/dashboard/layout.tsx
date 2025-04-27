"use client";

import RouteGuard from "../../components/auth/route-guard";
import DashboardLayout from "../../components/layouts/dashboard-layout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </RouteGuard>
  );
}
