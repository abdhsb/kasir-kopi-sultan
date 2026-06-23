"use client";

import Link from "next/link";
import Image from "next/image";
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
        <header className="flex items-center justify-between border-b border-orange-500/20 bg-neutral-950 px-6 py-3">
              <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 text-lg font-bold text-white">
                                <Image src="/logo.png" alt="Logo Sultan Coffee" width={32} height={32} className="object-contain" />
                                Kopi <span className="text-orange-500">Sultan</span>span>
                      </span>span>
                      <nav className="flex gap-1">
                        {links.map((link) => (
                      <Link
                                      key={link.href}
                                      href={link.href}
                                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                                        pathname.startsWith(link.href)
                                                          ? "bg-orange-500/10 text-orange-400"
                                                          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                      }`}
                                    >
                        {link.label}
                      </Link>Link>
                    ))}
                      </nav>nav>
              </div>div>
              <div className="flex items-center gap-4">
                      <span className="text-sm text-neutral-400">
                        {fullName} <span className="text-orange-500">({role})</span>span>
                      </span>span>
                      <button
                                  onClick={handleLogout}
                                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-orange-500/40 hover:text-orange-400"
                                >
                                Keluar
                      </button>button>
              </div>div>
        </header>header>
      );
}</header>
