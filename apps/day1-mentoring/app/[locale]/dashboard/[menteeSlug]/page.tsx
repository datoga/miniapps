"use client";

import { useParams } from "next/navigation";
import { AppShellWrapper } from "../../../../components/AppShellWrapper";
import { MenteeDetailView } from "../../../../components/MenteeDetailView";
import { extractMenteeId } from "../../../../lib/slug";

export default function MenteeDetailPage() {
  const params = useParams();
  const menteeSlug = params["menteeSlug"] as string;
  const menteeId = extractMenteeId(menteeSlug);

  return (
    <AppShellWrapper currentPath="mentee-detail">
      <MenteeDetailView menteeId={menteeId} />
    </AppShellWrapper>
  );
}

