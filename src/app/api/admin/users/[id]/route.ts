import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 }) };
  }

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requesterProfile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Hanya admin yang bisa melakukan ini." }, { status: 403 }) };
  }

  return { user };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { fullName, email, password, role } = await request.json();
  const adminClient = createAdminClient();

  if (email || password) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      ...(email ? { email } : {}),
      ...(password ? { password } : {}),
    });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  }

  const desiredRole: UserRole = role === "admin" ? "admin" : "kasir";
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName, role: desiredRole })
    .eq("id", id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  if (auth.user.id === id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun yang sedang login." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
