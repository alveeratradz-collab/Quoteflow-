import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
