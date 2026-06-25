"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

const emptyForm = { fullName: "", email: "", password: "", role: "kasir" as UserRole };
const emptyEditForm = { fullName: "", email: "", password: "", role: "kasir" as UserRole };

export default function PenggunaClient({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function changeRole(id: string, role: UserRole) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    router.refresh();
  }

  function startEdit(profile: Profile) {
    setEditingId(profile.id);
    setEditError(null);
    setEditForm({ fullName: profile.full_name, email: "", password: "", role: profile.role });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleEditSubmit(e: React.FormEvent, id: string) {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    const result = await res.json();

    if (!res.ok) {
      setEditError(result.error ?? "Gagal mengubah pengguna.");
      setEditSaving(false);
      return;
    }

    setEditSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengguna ini secara permanen? Akun login juga akan terhapus.")) return;
    setDeletingId(id);

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const result = await res.json();

    if (!res.ok) {
      alert(result.error ?? "Gagal menghapus pengguna.");
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
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
          {profiles.map((profile) =>
            editingId === profile.id ? (
              <tr key={profile.id} className="border-t border-neutral-800">
                <td colSpan={3} className="px-3 py-3">
                  <form
                    onSubmit={(e) => handleEditSubmit(e, profile.id)}
                    className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    {editError && (
                      <p className="col-span-full rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{editError}</p>
                    )}
                    <div>
                      <label className="text-xs font-medium text-neutral-400">Nama</label>
                      <input
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400">Email baru (opsional)</label>
                      <input
                        type="email"
                        placeholder="Biarkan kosong jika tidak diubah"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400">Password baru (opsional)</label>
                      <input
                        type="password"
                        minLength={6}
                        placeholder="Biarkan kosong jika tidak diubah"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-400">Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="kasir">Kasir</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        disabled={editSaving}
                        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
                      >
                        {editSaving ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500/40"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ) : (
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
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => changeRole(profile.id, profile.role === "admin" ? "kasir" : "admin")}
                      className="text-orange-400 hover:underline"
                    >
                      Jadikan {profile.role === "admin" ? "Kasir" : "Admin"}
                    </button>
                    <button onClick={() => startEdit(profile)} className="text-orange-400 hover:underline">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      disabled={deletingId === profile.id}
                      className="text-red-400 hover:underline disabled:opacity-50"
                    >
                      {deletingId === profile.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
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
