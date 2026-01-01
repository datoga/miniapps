"use client";

import { AppShellWrapper } from "../../../components/AppShellWrapper";
import { DashboardView } from "../../../components/DashboardView";

export default function DashboardPage() {
  return (
    <AppShellWrapper currentPath="dashboard">
      <DashboardView />
    </AppShellWrapper>
  );
}
