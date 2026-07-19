"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Settings, CreditCard, FileText, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
    name: string;
    email: string;
    avatar: string;
    subscription?: string;
    model?: string;
}

interface MenuItem {
    label: string;
    value?: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
}


const Gemini = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        height="1em"
        style={{
            flex: "none",
            lineHeight: 1,
        }}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        {...props}
    >
        <title>{"Gemini"}</title>
        <defs>
            <linearGradient
                id="lobe-icons-gemini-fill"
                x1="0%"
                x2="68.73%"
                y1="100%"
                y2="30.395%"
            >
                <stop offset="0%" stopColor="#1C7DFF" />
                <stop offset="52.021%" stopColor="#1C69FF" />
                <stop offset="100%" stopColor="#F0DCD6" />
            </linearGradient>
        </defs>
        <path
            d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12"
            fill="url(#lobe-icons-gemini-fill)"
            fillRule="nonzero"
        />
    </svg>
);


const SAMPLE_PROFILE_DATA: Profile = {
    name: "Eugene An",
    email: "eugene@kokonutui.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80",
    subscription: "PRO",
    model: "Gemini 2.0 Flash",
};

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: Profile;
    showTopbar?: boolean;
}

export function ProfileDropdown({
    data = SAMPLE_PROFILE_DATA,
    className,
    ...props
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const menuItems: MenuItem[] = [
        {
            label: "Profile",
            href: "/dashboard/profile",
            icon: <User className="w-4 h-4" />,
        },
        {
            label: "Model",
            value: data.model,
            href: "/dashboard/settings",
            icon: <Gemini className="w-4 h-4" />,
        },
        {
            label: "Subscription",
            value: data.subscription,
            href: "/dashboard/subscription",
            icon: <CreditCard className="w-4 h-4" />,
        },
        {
            label: "Settings",
            href: "/dashboard/settings",
            icon: <Settings className="w-4 h-4" />,
        },
        {
            label: "Terms & Policies",
            href: "/terms",
            icon: <FileText className="w-4 h-4" />,
            external: true,
        },
    ];

    return (
        <div className={cn("relative", className)} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-16 p-3 rounded-2xl bg-[--grok-gray-800] border border-[--color-border] hover:border-[--grok-accent] hover:bg-[--grok-gray-700] hover:shadow-sm transition-all duration-200 focus:outline-none"
                        >
                            <div className="text-left flex-1">
                                <div className="text-sm font-medium text-[--grok-white] tracking-tight leading-tight">
                                    {data.name}
                                </div>
                                <div className="text-xs text-[--grok-gray-400] tracking-tight leading-tight">
                                    {data.email}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-[--grok-gray-800]">
                                        <Image
                                            src={data.avatar}
                                            alt={data.name}
                                            width={36}
                                            height={36}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Bending line indicator on the right */}
                    <div
                        className={cn(
                            "absolute -right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
                            isOpen
                                ? "opacity-100"
                                : "opacity-60 group-hover:opacity-100"
                        )}
                    >
                        <svg
                            width="12"
                            height="24"
                            viewBox="0 0 12 24"
                            fill="none"
                            className={cn(
                                "transition-all duration-200",
                                isOpen
                                    ? "text-[--grok-accent] scale-110"
                                    : "text-[--grok-gray-400] group-hover:text-[--grok-white]"
                            )}
                            aria-hidden="true"
                        >
                            <path
                                d="M2 4C6 8 6 16 2 20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-64 p-2 bg-[--grok-gray-900] backdrop-blur-sm border border-[--color-border] rounded-2xl shadow-xl shadow-black/50 
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right"
                    >
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <Link
                                        href={item.href}
                                        target={item.external ? "_blank" : undefined}
                                        className="flex items-center p-3 hover:bg-[--grok-gray-800] rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-[--color-border]"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            {item.icon}
                                            <span className="text-sm font-medium text-[--grok-gray-300] tracking-tight leading-tight whitespace-nowrap group-hover:text-[--grok-white] transition-colors">
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="flex-shrink-0 ml-auto">
                                            {item.value && (
                                                <span
                                                    className={cn(
                                                        "text-xs font-medium rounded-md py-1 px-2 tracking-tight",
                                                        item.label === "Model"
                                                            ? "text-[--grok-accent] bg-[--grok-accent]/10 border border-[--grok-accent]/20"
                                                            : "text-purple-400 bg-purple-500/10 border border-purple-500/20"
                                                    )}
                                                >
                                                    {item.value}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                className="w-full flex items-center gap-3 p-3 duration-200 bg-red-500/10 rounded-xl hover:bg-red-500/20 cursor-pointer border border-transparent hover:border-red-500/30 hover:shadow-sm transition-all group"
                            >
                                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                                <span className="text-sm font-medium text-red-500 group-hover:text-red-600">
                                    Sign Out
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}
