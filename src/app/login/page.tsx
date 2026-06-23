"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
              setError(error.message);
              setLoading(false);
              return;
      }

      router.replace("/kasir");
        router.refresh();
  }

  return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.15),_transparent_60%)]" />
              <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm space-y-5 rounded-2xl border border-orange-500/20 bg-neutral-900 p-8 shadow-2xl shadow-orange-900/20"
                      >
                      <div className="text-center">
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                                            <Image src="/logo.png" alt="Logo Sultan Coffee" width={40} height={40} className="object-contain" />
                                </span>span>
                                <h1 className="mt-3 text-2xl font-bold text-white">
                                            Kopi <span className="text-orange-500">Sultan</span>span>
                                </h1>h1>
                                <p className="mt-1 text-sm text-neutral-400">Masuk untuk melanjutkan</p>p>
                      </div>div>
              
                {error && (
                                  <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>p>
                      )}
              
                      <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-300">Email</label>label>
                                <input
                                              type="email"
                                              required
                                              value={email}
                                              onChange={(e) => setEmail(e.target.value)}
                                              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                            />
                      </div>div>
              
                      <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-300">Password</label>label>
                                <div className="relative">
                                            <input
                                                            type={showPassword ? "text" : "password"}
                                                            required
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 pr-10 text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                          />
                                            <button
                                                            type="button"
                                                            onClick={() => setShowPassword((v) => !v)}
                                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs text-neutral-400 hover:text-orange-400"
                                                          >
                                              {showPassword ? "Sembunyikan" : "Lihat"}
                                            </button>button>
                                </div>div>
                      </div>div>
              
                      <button
                                  type="submit"
                                  disabled={loading}
                                  className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:opacity-50"
                                >
                        {loading ? "Memproses..." : "Masuk"}
                      </button>button>
              </form>form>
        </div>div>
      );
}</div>
