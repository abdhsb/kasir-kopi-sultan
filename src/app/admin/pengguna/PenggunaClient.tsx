"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

const emptyForm = { fullName: "", email: "", password: "", role: "kasir" as UserRole };

export default function PenggunaClient({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function changeRole(id: string, role: UserRole) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error ?? "Gagal menambah pengguna.");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <h2 className="col-span-full text-lg font-bold text-white">Tambah Pengguna</h2>

        {error && <p className="col-span-full rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{error}</p>}

        <div>
          <label className="text-xs font-medium text-neutral-400">Nama</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="kasir">Kasir</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </form>

    <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-neutral-950 text-left text-neutral-500">
          <tr>
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-t border-neutral-800">
              <td className="px-3 py-2 font-medium text-neutral-200">{profile.full_name}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    profile.role === "admin" ? "bg-orange-500/10 text-orange-400" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {profile.role}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => changeRole(profile.id, profile.role === "admin" ? "kasir" : "admin")}
                  className="text-orange-400 hover:underline"
                >
                  Jadikan {profile.role === "admin" ? "Kasir" : "Admin"}
                </button>
              </td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-4 text-center text-neutral-500">
                Belum ada pengguna.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
