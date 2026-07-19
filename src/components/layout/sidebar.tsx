"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardCheck, FileText, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: FileText },
  { href: "/dashboard/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarClock },
  { href: "/dashboard/reports", label: "Reports", icon: ClipboardCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-[--color-border] bg-[--grok-gray-900] text-sm lg:block">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[--grok-accent] to-orange-600 text-white font-bold text-lg">
          H
        </div>
        <div>
          <p className="font-semibold text-[--grok-white]">HireAI</p>
          <p className="text-xs text-[--grok-gray-400]">Interview Platform</p>
        </div>
      </div>
      <nav className="px-3">
        {links.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                active
                  ? "bg-[--grok-accent]/15 text-[--grok-accent] border border-[--grok-accent]/20"
                  : "text-[--grok-gray-400] hover:bg-[--grok-gray-800] hover:text-[--grok-white] border border-transparent"
              )}
            >
              <Icon size={18} className={active ? "text-[--grok-accent]" : ""} />
              <span className={active ? "font-medium" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-[--color-border] px-6 py-4 text-xs text-[--grok-gray-400]">
        <p>AI-powered interviews</p>
        <p>Voice & video enabled</p>
      </div>
    </aside>
  );
}
