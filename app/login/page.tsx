"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotInfo, setForgotInfo] = useState(false);

  useEffect(() => {
    const savedPass =
      sessionStorage.getItem("idiq_admin_password") ||
      localStorage.getItem("idiq_admin_password");
    if (savedPass) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotInfo(false);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error || "Email/Nama Pengguna atau Kata Sandi salah."
        );
      }

      sessionStorage.setItem("idiq_admin_password", password);
      sessionStorage.setItem(
        "idiq_admin_user",
        usernameOrEmail.trim() || "Admin"
      );
      if (rememberMe) {
        localStorage.setItem("idiq_admin_password", password);
        localStorage.setItem(
          "idiq_admin_user",
          usernameOrEmail.trim() || "Admin"
        );
      } else {
        localStorage.removeItem("idiq_admin_password");
      }

      window.dispatchEvent(new Event("storage"));
      router.push("/admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal masuk ke sistem."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#f1f5f9]">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-lg p-7 sm:p-9">
        {/* Logo IdiqNotebook di Atas */}
        <div className="flex justify-center mb-5">
          <Image
            src="/image/IN-logo2.png"
            alt="IdiqNotebook Logo"
            width={200}
            height={52}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        {/* Heading & Subheading Sesuai Gambar */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-extrabold text-[#0f2c59] tracking-tight">
            Masuk ke Akun Anda
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Gunakan akun admin atau pengajar Anda untuk melanjutkan.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Lupa Kata Sandi */}
        {forgotInfo && (
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#1b9c85]" />
            <span>
              Kata sandi admin diatur melalui variabel{" "}
              <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-300 text-[#0f2c59]">
                ADMIN_PASSWORD
              </code>{" "}
              pada file <code>.env.local</code> atau pengaturan Vercel Anda.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Email atau Nama Pengguna */}
          <div>
            <label
              htmlFor="username-input"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              Email atau Nama Pengguna
            </label>
            <input
              id="username-input"
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Email atau Nama Pengguna"
              autoComplete="username"
              required
              className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b9c85] focus:border-transparent transition"
            />
          </div>

          {/* Input Kata Sandi dengan Toggle Mata */}
          <div>
            <label
              htmlFor="password-input"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata Sandi"
                autoComplete="current-password"
                required
                className="w-full pl-4 pr-11 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b9c85] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                aria-label={
                  showPassword
                    ? "Sembunyikan Kata Sandi"
                    : "Tampilkan Kata Sandi"
                }
              >
                {showPassword ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Checkbox Ingat Saya & Lupa Kata Sandi */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="inline-flex items-center gap-2 text-slate-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1b9c85] focus:ring-[#1b9c85]"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotInfo(!forgotInfo)}
              className="font-semibold text-[#1b9c85] hover:text-[#15806d] hover:underline cursor-pointer"
            >
              Lupa Kata Sandi?
            </button>
          </div>

          {/* Tombol Masuk ke Sistem (Rounded Pill Soft Teal Sesuai Gambar) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-full bg-[#4db6ac] hover:bg-[#1b9c85] active:bg-[#15806d] text-white font-bold text-sm shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memverifikasi Akun...
              </>
            ) : (
              "Masuk ke Sistem"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
