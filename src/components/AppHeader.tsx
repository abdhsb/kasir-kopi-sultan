"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({
  fullName,
  role,
}: {
  fullName: string;
  role: "admin" | "kasir";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const links = [
    { href: "/kasir", label: "Kasir" },
    ...(role === "admin"
      ? [
          { href: "/admin/produk", label: "Produk" },
          { href: "/admin/laporan", label: "Laporan" },
          { href: "/admin/pengguna", label: "Pengguna" },
        ]
      : []),
  ];

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-amber-800">Kopi Sultan</span>
        <nav className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${
                pathname.startsWith(link.href)
                  ? "text-amber-700"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-stone-600">
          {fullName} <span className="text-stone-400">({role})</span>
        </span>
        <button
          onClick={handleLogout}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
