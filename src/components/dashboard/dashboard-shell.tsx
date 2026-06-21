"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Bot, MessageSquare, BarChart2, Users,
  Bell, Settings, LogOut, Menu, X, LifeBuoy, ShoppingCart,
  BookOpen, Shield, Crown, User, Zap,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useNotificationContext } from "@/components/dashboard/realtime-notification-provider";
import type { UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  user: SupabaseUser;
  org: { id: string; name: string };
  unreadCount: number;
  role: UserRole;
}

/* ── Nav item definition ── */
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: boolean;
  /** Permission key from ROLE_PERMISSIONS — if set, item only shows when user has that permission */
  permission?: keyof typeof ROLE_PERMISSIONS["owner"];
  /** Separate group divider above this item */
  groupStart?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard",                   label: "Overview",          icon: LayoutDashboard,  exact: true },
  { href: "/dashboard/chatbots",          label: "Chatbots",          icon: Bot,              permission: "canCreateChatbot" },
  { href: "/dashboard/conversations",     label: "Conversations",     icon: MessageSquare },
  { href: "/dashboard/analytics",         label: "Analytics",         icon: BarChart2,        permission: "canViewAnalytics", groupStart: true },
  { href: "/dashboard/team",              label: "Team",              icon: Users,            permission: "canManageTeam" },
  { href: "/dashboard/settings",          label: "Settings",          icon: Settings,         permission: "canManageSettings" },
  { href: "/dashboard/notifications",     label: "Notifications",     icon: Bell,             badge: true },
  { href: "/dashboard/purchase-requests", label: "Purchase Requests", icon: ShoppingCart,     permission: "canViewPurchaseRequests", groupStart: true },
];

/* ── Colour tokens ── */
const C = {
  sidebarBg:     "#0a0f1e",
  sidebarBorder: "rgba(255,255,255,0.08)",
  activeItem:    "#0d8585",
  hoverItem:     "rgba(13,133,133,0.18)",
  textDim:       "rgba(255,255,255,0.5)",
  textMid:       "rgba(255,255,255,0.75)",
  textBright:    "#fff",
  accent:        "#1dbfa0",
  divider:       "rgba(255,255,255,0.05)",
};

/* ── Role badge styles ── */
const ROLE_UI: Record<UserRole, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  super_admin: { icon: Shield,  color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "Super Admin" },
  owner:       { icon: Crown,   color: C.accent,  bg: "rgba(29,191,160,0.12)", label: "Owner" },
  agent:       { icon: User,    color: "#818cf8",  bg: "rgba(99,102,241,0.12)", label: "Agent" },
  guest:       { icon: User,    color: C.textDim,  bg: "rgba(255,255,255,0.05)", label: "Guest" },
};

/* ═══════════════════════════════════════════════════
   SIDEBAR CONTENT
═══════════════════════════════════════════════════ */
interface SidebarContentProps {
  org: { id: string; name: string };
  user: SupabaseUser;
  role: UserRole;
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
}

function SidebarContent({ org, user, role, pathname, onClose, onSignOut }: SidebarContentProps) {
  const { unreadCount } = useNotificationContext();
  const perms = ROLE_PERMISSIONS[role];
  const roleUi = ROLE_UI[role];
  const RoleIcon = roleUi.icon;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return (perms[item.permission] as boolean) === true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Logo */}
      <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em",
            fontWeight: 800, fontSize: "1.2rem", color: C.textBright,
          }}>
            MJ<span style={{ color: C.accent }}>.</span>TALK
          </span>
        </Link>
      </div>

      {/* Workspace chip */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <p style={{ fontSize: "0.6rem", color: C.textDim, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.2rem" }}>
          Workspace
        </p>
        <p style={{
          fontSize: "0.83rem", color: C.textMid, fontWeight: 500,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {org.name}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.6rem 0.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1px" }}>
        {visibleItems.map((item, idx) => {
          const active = isActive(item);
          const prev = visibleItems[idx - 1];
          const showDivider = item.groupStart && idx > 0 && prev;

          return (
            <div key={item.href}>
              {showDivider && (
                <div style={{ height: "1px", background: C.sidebarBorder, margin: "6px 8px" }} />
              )}
              <Link
                href={item.href}
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.5rem 0.75rem", borderRadius: "8px",
                  fontSize: "0.85rem", fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  background: active ? C.activeItem : "transparent",
                  color: active ? C.textBright : C.textDim,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.hoverItem; e.currentTarget.style.color = C.textBright; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; } }}
              >
                <item.icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span style={{
                    background: "#ef4444", color: "#fff", fontSize: "0.62rem",
                    fontWeight: 700, borderRadius: "999px", minWidth: "18px", height: "18px",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                    flexShrink: 0,
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom: support + user */}
      <div style={{ padding: "0.5rem 0.5rem", borderTop: `1px solid ${C.sidebarBorder}` }}>

        {/* Docs link */}
        <Link
          href="/docs"
          style={{
            display: "flex", alignItems: "center", gap: "0.65rem",
            padding: "0.45rem 0.75rem", borderRadius: "8px", marginBottom: "2px",
            fontSize: "0.8rem", fontWeight: 400, textDecoration: "none",
            color: C.textDim, transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.hoverItem; e.currentTarget.style.color = C.textBright; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; }}
        >
          <BookOpen size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
          <span>Docs</span>
        </Link>

        {/* Support link */}
        <Link
          href="/contact"
          style={{
            display: "flex", alignItems: "center", gap: "0.65rem",
            padding: "0.45rem 0.75rem", borderRadius: "8px", marginBottom: "6px",
            fontSize: "0.8rem", fontWeight: 400, textDecoration: "none",
            color: C.textDim, transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.hoverItem; e.currentTarget.style.color = C.textBright; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; }}
        >
          <LifeBuoy size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
          <span>Support</span>
        </Link>

        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.5rem 0.75rem", borderRadius: "8px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Avatar */}
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
            background: C.activeItem, color: C.textBright,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.68rem", fontWeight: 700,
          }}>
            {getInitials(user.email ?? "U")}
          </div>

          {/* Email + role badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: "0.72rem", color: C.textBright, fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user.email}
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              fontSize: "0.6rem", fontWeight: 700,
              color: roleUi.color, background: roleUi.bg,
              padding: "1px 6px", borderRadius: "999px", marginTop: "2px",
            }}>
              <RoleIcon size={9} />
              {roleUi.label}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.textDim, padding: "4px", borderRadius: "6px",
              display: "flex", alignItems: "center", transition: "color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHELL
═══════════════════════════════════════════════════ */
export function DashboardShell({ children, user, org, unreadCount: _initialUnread, role }: DashboardShellProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotificationContext();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sidebarProps: SidebarContentProps = {
    org, user, role, pathname,
    onClose: () => setSidebarOpen(false),
    onSignOut: handleSignOut,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f5fafa" }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex"
        style={{ width: "224px", flexShrink: 0, flexDirection: "column", background: C.sidebarBg }}
      >
        <SidebarContent {...sidebarProps} onClose={() => {}} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside style={{ position: "relative", width: "224px", background: C.sidebarBg, display: "flex", flexDirection: "column", zIndex: 10 }}>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: C.accent }}
            >
              <X size={18} />
            </button>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Mobile top bar */}
        <header
          className="lg:hidden"
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0 1rem", height: "56px",
            background: C.sidebarBg, borderBottom: `1px solid ${C.sidebarBorder}`, flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}
          >
            <Menu size={20} />
          </button>
          <span style={{
            fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.04em",
            fontWeight: 800, fontSize: "1.1rem", color: C.textBright,
          }}>
            MJ<span style={{ color: C.accent }}>.</span>TALK
          </span>
          {unreadCount > 0 && (
            <Link href="/dashboard/notifications" style={{ marginLeft: "auto" }}>
              <span style={{
                background: "#ef4444", color: "#fff",
                fontSize: "0.7rem", fontWeight: 700,
                borderRadius: "999px", padding: "2px 8px",
              }}>
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
