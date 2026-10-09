import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { getAdminContext } from "@/lib/admin-auth";
import { getSiteUrl } from "@/lib/env";
import { fetchPublicState } from "@/lib/public-state";
import { AdminConsole } from "./AdminConsole";

export const metadata: Metadata = {
  title: "Администрација — Бизнис Арена 2026",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-navy-950" />}>
      <AdminGate />
    </Suspense>
  );
}

async function AdminGate() {
  await connection();
  const admin = await getAdminContext();
  if (admin.status === "anonymous") redirect("/admin/login");
  if (admin.status === "forbidden") {
    return (
      <main className="app-surface flex min-h-dvh items-center justify-center bg-navy-950 px-5 text-white">
        <div className="slab w-full max-w-md bg-navy p-8">
          <div className="h-10">
            <Logo />
          </div>
          <h1 className="mt-6 font-display text-[28px] leading-tight font-extrabold uppercase">Немате пристап</h1>
          <p className="mt-2 text-ink-2">
            Сметката <strong>{admin.user.email}</strong> не е на листата на администратори.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button className="h-11 rounded-[3px] px-5 font-semibold ring-1 ring-white/25 hover:bg-white/5">Одјави се</button>
          </form>
        </div>
      </main>
    );
  }
  const site = getSiteUrl();
  const initial = await fetchPublicState().catch(() => null);
  return <AdminConsole email={admin.user.email ?? ""} initial={initial} site={site} />;
}
