import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Најава — Бизнис Арена 2026",
};

export default function LoginPage() {
  return <LoginForm />;
}
