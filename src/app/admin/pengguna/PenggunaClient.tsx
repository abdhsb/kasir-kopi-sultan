"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

export default function PenggunaClient({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function changeRole(id: string, role: UserRole) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-stone-500">
          <tr>
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-t border-stone-100">
              <td className="px-3 py-2 font-medium text-stone-700">{profile.full_name}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    profile.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {profile.role}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => changeRole(profile.id, profile.role === "admin" ? "kasir" : "admin")}
                  className="text-amber-700 hover:underline"
                >
                  Jadikan {profile.role === "admin" ? "Kasir" : "Admin"}
                </button>
              </td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-4 text-center text-stone-400">
                Belum ada pengguna.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
