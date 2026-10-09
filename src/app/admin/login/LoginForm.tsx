"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { getAuthBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const { error: signInError } = await getAuthBrowserClient().auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "Погрешна е-пошта или лозинка."
          : "Најавата не успеа. Обидете се повторно.",
      );
      setPending(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="app-surface flex min-h-dvh items-center justify-center bg-navy-950 px-5 text-white">
      <form onSubmit={onSubmit} className="slab w-full max-w-sm bg-navy p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="h-10">
          <Logo priority />
        </div>
        <h1 className="mt-7 font-display text-[30px] leading-none font-extrabold uppercase">Контролна соба</h1>
        <p className="mt-2 text-sm text-ink-2">Пристап само за овластени организатори.</p>
        <label className="mt-7 block text-sm font-semibold text-ink-2" htmlFor="email">
          Е-пошта
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-[3px] bg-navy-800 px-4 text-base text-white ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-blue"
        />
        <label className="mt-4 block text-sm font-semibold text-ink-2" htmlFor="password">
          Лозинка
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-[3px] bg-navy-800 px-4 text-base text-white ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-blue"
        />
        {error && (
          <p role="alert" className="mt-4 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-7 h-12 w-full rounded-[3px] bg-blue font-display text-[18px] font-bold tracking-[0.06em] text-navy uppercase disabled:opacity-60"
        >
          {pending ? "Се најавува…" : "Најави се"}
        </button>
      </form>
    </main>
  );
}
