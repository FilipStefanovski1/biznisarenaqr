import type { Metadata } from "next";
import { VoteApp } from "./VoteApp";

export const metadata: Metadata = {
  title: "Гласај — Бизнис Арена 2026",
};

export default function VotePage() {
  return <VoteApp />;
}
