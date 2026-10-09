/**
 * Creates (or updates) a Supabase Auth user and adds it to the admin allowlist.
 *
 *   ADMIN_EMAIL=organizer@example.com ADMIN_PASSWORD='long-random-password' npm run admin:provision
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (service role) in the
 * environment (.env.local is loaded automatically). Public sign-up stays disabled; this
 * script is the only way an admin account is created.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env";

loadEnv();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!url || !secret) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  if (!email) throw new Error("ADMIN_EMAIL is required.");
  if (!password || password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");

  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  let userId: string | undefined;
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
    console.log(`Created auth user ${email}`);
  } else {
    // Already exists: find it and reset the password.
    for (let page = 1; !userId && page < 50; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw created.error ?? new Error("Could not create or find user");
    const { error } = await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (error) throw error;
    console.log(`Updated password for existing auth user ${email}`);
  }

  const { error } = await supabase.rpc("provision_admin", { p_user_id: userId, p_email: email });
  if (error) throw error;
  console.log(`✓ ${email} is on the admin allowlist.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
