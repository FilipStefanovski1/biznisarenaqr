import { z } from "zod";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/messages";

/** Shape returned by public.get_public_state() and broadcast on the `scoreboard` topic. */
export const roundStatusSchema = z.enum(["waiting", "open", "closed"]);
export type RoundStatus = z.infer<typeof roundStatusSchema>;

export const snapshotSchema = z.object({
  version: z.number().int().nonnegative(),
  /** LED screen language chosen by the organizers. */
  screenLocale: z.enum(LOCALES).default(DEFAULT_LOCALE),
  /** Database clock when the snapshot was produced; used to correct device clock skew. */
  serverTime: z.string().optional(),
  round: z
    .object({
      id: z.string().uuid(),
      label: z.string(),
      isRehearsal: z.boolean(),
      status: roundStatusSchema,
      createdAt: z.string().nullable().optional(),
      openedAt: z.string().nullable(),
      closedAt: z.string().nullable(),
      /** Voting deadline when the round runs on a timer (null = no timer). */
      closesAt: z.string().nullable().optional(),
    })
    .nullable(),
  results: z.array(z.object({ contestantId: z.string(), votes: z.number().int().nonnegative() })),
  total: z.number().int().nonnegative(),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
export type Round = NonNullable<Snapshot["round"]>;

export function parseSnapshot(value: unknown): Snapshot | null {
  const parsed = snapshotSchema.safeParse(value);
  if (!parsed.success) return null;
  // Reject internally inconsistent payloads (defence against corrupted messages).
  const sum = parsed.data.results.reduce((acc, r) => acc + r.votes, 0);
  if (sum !== parsed.data.total) return null;
  return parsed.data;
}

/**
 * Versions come from one global database sequence, so a higher version is always newer,
 * also across rounds. Equal or lower versions are stale duplicates and are ignored.
 */
export function isNewer(current: Snapshot | null, incoming: Snapshot): boolean {
  return current === null || incoming.version > current.version;
}

export const myVoteSchema = z
  .object({
    roundId: z.string().uuid(),
    contestantId: z.string(),
    createdAt: z.string().optional(),
  })
  .nullable();

export const voterStateSchema = z.object({
  state: snapshotSchema,
  myVote: myVoteSchema,
});

export type VoterState = z.infer<typeof voterStateSchema>;
export type MyVote = z.infer<typeof myVoteSchema>;
