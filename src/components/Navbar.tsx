"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Sun, Moon, Menu, X, Code, Shield, Edit, BookOpen, Layers, User } from "lucide-react";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isSignedIn } = useUser();

  const role = (user?.publicMetadata?.role as string) || "viewer";
  const isAdmin = role === "admin";
  const isWriter = role === "writer" || role === "admin";

  const navigation = [
    { name: "Timeline", href: "/", icon: Layers },
    { name: "Articles", href: "/articles", icon: BookOpen },
    { name: "Learning Notes", href: "/notes", icon: Code },
    { name: "Projects", href: "/projects", icon: Code },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 glass border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                devFeed
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive(item.href)
                        ? "text-brand-600 dark:text-brand-500 bg-brand-50 dark:bg-brand-500/10"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Role-based Editor/Admin Links */}
            {isSignedIn && (
              <>
                {isWriter && (
                  <Link
                    href="/write"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm cursor-pointer"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Write</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer border dark:border-zinc-700"
                  >
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}

            {/* Clerk User Actions */}
            <div className="flex items-center">
              {isSignedIn && (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700",
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="My Profile"
                      labelIcon={<User className="h-4 w-4 text-indigo-500" />}
                      href="/profile"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              )}
              {!isSignedIn && (
                <div className="flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <button className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 rounded-md transition-colors shadow-sm cursor-pointer">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-zinc-950 px-4 pt-2 pb-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive(item.href)
                  ? "text-brand-600 dark:text-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            {isSignedIn && (
              <>
                {isWriter && (
                  <Link
                    href="/write"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Write Post</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-zinc-350 bg-slate-100 dark:bg-zinc-800 rounded-md border dark:border-zinc-800"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <div className="flex justify-center py-2">
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="My Profile"
                        labelIcon={<User className="h-4 w-4 text-indigo-500" />}
                        href="/profile"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              </>
            )}
            {!isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className="w-full text-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-md hover:bg-slate-200 cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-slate-800 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
