"use client";

import AdminGuard from "@/lib/authGuard";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  MessageSquare, 
  Megaphone, 
  Settings, 
  LogOut 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth);
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Posts", href: "/posts", icon: FileText },
    { label: "Users", href: "/users", icon: Users },
    { label: "Comments", href: "/comments", icon: MessageSquare },
    { label: "Broadcast", href: "/broadcast", icon: Megaphone },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)] font-sans">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 flex flex-col bg-[#11192b]">
          <div className="p-6 h-16 flex items-center border-b border-white/10">
            <h1 className="text-xl font-bold font-mono tracking-tighter text-[var(--color-tertiary)]">
              DevJournal <span className="text-white text-sm font-normal">Admin</span>
            </h1>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-[var(--radius-card)] transition-colors duration-200 ${
                    isActive
                      ? "bg-[var(--color-primary-container)] text-white font-medium"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[var(--color-background)]">
            <div className="flex-1" />
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center font-bold text-sm">
                  {currentUser?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <span className="text-sm font-medium text-white/90">
                  {currentUser?.displayName || currentUser?.email || "Admin"}
                </span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm text-white/70 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
