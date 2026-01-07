"use client";

import type { ReactNode } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@miniapps/ui";
import { BrandTitle } from "./BrandTitle";
import { ProfessionLocaleSwitcher } from "./ProfessionLocaleSwitcher";

interface HeaderWithNavProps {
  title?: ReactNode;
  professionSlugs?: {
    en: string;
    es: string;
  };
}

export function HeaderWithNav({ title, professionSlugs }: HeaderWithNavProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || "en";

  const handleTitleClick = () => {
    router.push(`/${locale}`);
  };

  return (
    <Header
      title={title ?? <BrandTitle />}
      onTitleClick={handleTitleClick}
      localeSwitcher={professionSlugs ? <ProfessionLocaleSwitcher slugs={professionSlugs} /> : undefined}
    />
  );
}
