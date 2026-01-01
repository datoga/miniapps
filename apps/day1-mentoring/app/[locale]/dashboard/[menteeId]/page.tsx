"use client";

import { useParams } from "next/navigation";
import { AppShellWrapper } from "../../../../components/AppShellWrapper";
import { MenteeDetailView } from "../../../../components/MenteeDetailView";

export default function MenteeDetailPage() {
  const params = useParams();
  const menteeId = params["menteeId"] as string;

  return (
    <AppShellWrapper currentPath="mentee-detail">
      <MenteeDetailView menteeId={menteeId} />
    </AppShellWrapper>
  );
}

