import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <Image
        src="/logo.png"
        alt=""
        width={600}
        height={600}
        className="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 object-contain opacity-5"
      />
      <AppHeader fullName={profile?.full_name ?? user.email ?? ""} role={profile?.role ?? "kasir"} />
      <main>{children}</main>
    </div>
  );
}
