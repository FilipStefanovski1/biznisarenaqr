import "server-only";
import { getPublicClient } from "@/lib/supabase/server";
import { parseSnapshot, type Snapshot } from "@/lib/snapshot";

export async function fetchPublicState(): Promise<Snapshot> {
  const { data, error } = await getPublicClient().rpc("get_public_state");
  if (error) throw new Error(`get_public_state failed: ${error.message}`);
  const snapshot = parseSnapshot(data);
  if (!snapshot) throw new Error("get_public_state returned an invalid snapshot");
  return snapshot;
}
