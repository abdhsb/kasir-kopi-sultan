import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requesterProfile?.role !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang bisa menambah pengguna." }, { status: 403 });
  }

  const { email, password, fullName, role } = await request.json();

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Email, password, dan nama wajib diisi." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Gagal membuat pengguna." }, { status: 400 });
  }

  const desiredRole: UserRole = role === "admin" ? "admin" : "kasir";

  if (desiredRole === "admin") {
    const { error: roleError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", created.user.id);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id: created.user.id });
}
