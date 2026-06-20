"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Bot, MessageSquare, BarChart2, Users,
  Bell, Settings, LogOut, Menu, X, LifeBuoy, ShoppingCart,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  org: { id: string; name: string };
  unreadCount: number;
}

const navItems = [
  { href: "/dashboard",                     label: "Overview",           icon: LayoutDashboard, exact: true },
  { href: "/dashboard/chatbots",            label: "Chatbots",           icon: Bot },
  { href: "/dashboard/conversations",       label: "Conversations",      icon: MessageSquare },
  { href: "/dashboard/analytics",           label: "Analytics",          icon: BarChart2 },
  { href: "/dashboard/purchase-requests",   label: "Purchase Requests",  icon: ShoppingCart, adminOnly: true }, // Only for super admin
  { href: "/dashboard/team",                label: "Team",               icon: Users },
  { href: "/dashboard/notifications",       label: "Notifications",      icon: Bell, badge: true },
  { href: "/dashboard/settings",            label: "Settings",           icon: Settings },
];

/* ── colour tokens (same as landing page) ── */
const C = {
  sidebarBg:    "#0a0f1e",      // deep navy
  sidebarBorder:"rgba(255,255,255,0.08)",
  activeItem:   "#0d8585",      // teal-600
  hoverItem:    "rgba(13,133,133,0.18)",
  textDim:      "rgba(255,255,255,0.55)",
  textMid:      "rgba(255,255,255,0.75)",
  textBright:   "#fff",
  accent:       "#1dbfa0",      // teal-400 mint
  orgBg:        "rgba(255,255,255,0.05)",
};

interface SidebarContentProps {
  org: { id: string; name: string };
  user: User;
  unreadCount: number;
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
}

function SidebarContent({ org, user, unreadCount, pathname, onClose, onSignOut }: SidebarContentProps) {
  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  // Super admin email
  const SUPER_ADMIN_EMAIL = "meerujutti0.001@gmail.com";
  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return isSuperAdmin;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Logo */}
      <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em", fontWeight: 800, fontSize: "1.2rem", color: C.textBright }}>
            MJ<span style={{ color: C.accent }}>.</span>TALK
          </span>
        </Link>
      </div>

      {/* Workspace */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <p style={{ fontSize: "0.65rem", color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Workspace</p>
        <p style={{ fontSize: "0.85rem", color: C.textMid, fontWeight: 500, marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
        {visibleNavItems.map(item => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "0.55rem 0.75rem", borderRadius: "8px",
                fontSize: "0.875rem", fontWeight: active ? 600 : 500,
                textDecoration: "none",
                background: active ? C.activeItem : "transparent",
                color: active ? C.textBright : C.textDim,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.hoverItem; e.currentTarget.style.color = C.textBright; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; }}}
            >
              <item.icon size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", fontSize: "0.65rem",
                  fontWeight: 700, borderRadius: "999px", minWidth: "18px", height: "18px",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "0.75rem 0.5rem", borderTop: `1px solid ${C.sidebarBorder}` }}>
        {/* Contact Support button */}
        <Link
          href="/contact"
          style={{
            display: "flex", alignItems: "center", gap: "0.65rem",
            padding: "0.5rem 0.75rem", borderRadius: "8px", marginBottom: "4px",
            fontSize: "0.8rem", fontWeight: 500, textDecoration: "none",
            color: C.textDim, transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.hoverItem; e.currentTarget.style.color = C.textBright; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; }}
          title="Contact support team"
        >
          <LifeBuoy size={15} style={{ flexShrink: 0 }} />
          <span>Contact Support</span>
        </Link>

        <div style={{
          display: "flex", alignItems: "center", gap: "0.65rem",
          padding: "0.5rem 0.75rem", borderRadius: "8px",
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
            background: C.activeItem, color: C.textBright,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem", fontWeight: 700,
          }}>
            {getInitials(user.email ?? "U")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.75rem", color: C.textBright, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
            <p style={{ fontSize: "0.65rem", color: C.accent }}>Owner</p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = C.textBright)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ children, user, org, unreadCount }: DashboardShellProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f5fafa" }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex" style={{ width: "220px", flexDirection: "column", background: C.sidebarBg, flexShrink: 0 }}>
        <SidebarContent
          org={org} user={user} unreadCount={unreadCount}
          pathname={pathname} onClose={() => {}} onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position: "relative", width: "220px", background: C.sidebarBg, display: "flex", flexDirection: "column", zIndex: 10 }}>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: C.accent }}
            >
              <X size={18} />
            </button>
            <SidebarContent
              org={org} user={user} unreadCount={unreadCount}
              pathname={pathname} onClose={() => setSidebarOpen(false)} onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Mobile top bar */}
        <header className="lg:hidden" style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0 1rem", height: "56px",
          background: C.sidebarBg, borderBottom: `1px solid ${C.sidebarBorder}`, flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}>
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em", fontWeight: 800, fontSize: "1.1rem", color: C.textBright }}>
            MJ<span style={{ color: C.accent }}>.</span>TALK
          </span>
          {unreadCount > 0 && (
            <Link href="/dashboard/notifications" style={{ marginLeft: "auto" }}>
              <span style={{ background: "#ef4444", color: "#fff", fontSize: "0.7rem", fontWeight: 700, borderRadius: "999px", padding: "2px 8px" }}>
                {unreadCount}
              </span>
            </Link>
          )}
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>

    </div>
  );
}

