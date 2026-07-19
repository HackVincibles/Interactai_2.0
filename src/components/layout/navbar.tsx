import Link from "next/link";
import { Bell, CircleUserRound } from "lucide-react";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";

export function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-[--color-border] bg-[--grok-gray-900] px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[--grok-gray-400]">HireAI Platform</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/dashboard" className="hover:text-[--grok-accent] transition-colors">
          Dashboard
        </Link>
        <Link href="/dashboard/interviews" className="hover:text-[--grok-accent] transition-colors">
          Interviews
        </Link>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-[--color-border] bg-[--grok-gray-800] px-3 py-2 text-sm hover:border-[--grok-accent]"
        >
          <Bell size={16} className="mr-2" />
          Alerts
        </button>
        <ProfileDropdown />
      </div>
    </header>
  );
}
