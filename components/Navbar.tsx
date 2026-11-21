"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Video,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";

function NavbarInner() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const savedPass =
        sessionStorage.getItem("idiq_admin_password") ||
        localStorage.getItem("idiq_admin_password");
      setIsAdminLoggedIn(Boolean(savedPass));
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [pathname]);

  const navItems = [
    { label: "Beranda", href: "/" },
    { label: "Tabel Kata", href: "/vocabulary", icon: BookOpen },
    { label: "Materi Video", href: "/videos", icon: Video },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white text-slate-800 shadow-sm border-b border-slate-200">
      <div className="w-[90%] max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between h-18">
          {/* Logo Brand: /image/IN-logo2.png */}
          <Link
            href="/"
            className="flex items-center hover:opacity-95 transition py-2"
          >
            <Image
              src="/image/IN-logo2.png"
              alt="IdiqNotebook Logo"
              width={190}
              height={48}
              className="h-10 sm:h-11 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-5 text-sm font-semibold transition-colors ${
                    active
                      ? "text-[#0f2c59] font-bold"
                      : "text-slate-600 hover:text-[#0f2c59]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1b9c85] rounded-full" />
                  )}
                </Link>
              );
            })}
            {isAdminLoggedIn && (
              <Link
                href="/admin"
                className={`relative py-5 text-sm font-semibold transition-colors ${
                  pathname.startsWith("/admin")
                    ? "text-[#1b9c85] font-bold"
                    : "text-slate-600 hover:text-[#1b9c85]"
                }`}
              >
                Dashboard Admin
                {pathname.startsWith("/admin") && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1b9c85] rounded-full" />
                )}
              </Link>
            )}
          </nav>

          {/* Tombol Login / Panel Admin */}
          <div className="hidden md:flex items-center gap-3">
            {isAdminLoggedIn ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition shadow-xs bg-[#1b9c85] hover:bg-[#15806d] text-white"
              >
                <LayoutDashboard className="w-4 h-4" />
                Panel Admin
              </Link>
            ) : (
              <Link
                href="/login"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition shadow-xs ${
                  pathname === "/login"
                    ? "bg-[#0f2c59] text-white ring-2 ring-[#1b9c85]/40"
                    : "bg-[#1b9c85] hover:bg-[#15806d] text-white"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-[#0f2c59] hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 pt-3 pb-4 shadow-lg">
          <div className="w-[90%] max-w-[1280px] mx-auto space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-semibold ${
                  active
                    ? "bg-slate-100 text-[#0f2c59] font-bold border-l-4 border-[#1b9c85]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#0f2c59]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdminLoggedIn && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-semibold ${
                pathname.startsWith("/admin")
                  ? "bg-teal-50 text-[#1b9c85] font-bold border-l-4 border-[#1b9c85]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-[#1b9c85]"
              }`}
            >
              Dashboard Admin
            </Link>
          )}
          <div className="pt-2 border-t border-slate-200">
            <Link
              href={isAdminLoggedIn ? "/admin" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold bg-[#1b9c85] hover:bg-[#15806d] text-white transition"
            >
              {isAdminLoggedIn ? (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  Panel Admin
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              )}
            </Link>
          </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200 h-18" />
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
