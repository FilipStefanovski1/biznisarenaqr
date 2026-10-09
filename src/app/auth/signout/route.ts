import { NextResponse, connection, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/http";
import { getSessionClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  await connection();
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const client = await getSessionClient();
  await client.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
