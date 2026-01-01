"use client";

import { AppShellWrapper } from "../../../components/AppShellWrapper";
import { DashboardView } from "../../../components/DashboardView";

export default function DashboardPage() {
  console.log("DASHBOARD PAGE RENDERED - DEBUG 999");
  return (
    <AppShellWrapper currentPath="dashboard">
      <DashboardView />
    </AppShellWrapper>
  );
}
