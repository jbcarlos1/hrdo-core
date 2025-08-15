"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Menu,
    Boxes,
    LogOut,
    ShieldCheck,
    Building2,
    Users,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
}

const formatName = (name: string) => {
    return name
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const navItems: NavItem[] = [
    {
        title: "Memo",
        href: "/admin-dashboard",
        icon: Boxes,
        roles: ["ADMIN"],
    },
];

function useActivePath() {
    const pathname = usePathname();
    return (href: string) => pathname === href;
}

export default function Sidebar() {
    const { data: session } = useSession();
    const [isExpanded, setIsExpanded] = useState(true);
    const isActive = useActivePath();
    const user = session?.user.name;
    const email = session?.user.email;
    const image = session?.user.image;
    const isApproved = session?.user.isApproved;

    const roleMap: Record<string, string> = {
        USER: "User",
        APPROVER: "Approver",
        ADMIN: "Admin",
    };

    const divisionMap: Record<string, string> = {
        ALL: "",
        MANAGEMENT: "Management",
        RECRUITMENT: "Recruitment Division",
        PLANNING_RESEARCH: "Planning & Research Division",
        DEVELOPMENT_BENEFITS: "Development & Benefits Division",
    };

    const sectionMap: Record<string, string> = {
        ALL: "All",
        EXECUTIVE: "Executive",
        ADMINISTRATIVE: "Administrative Section",
        RECRUITMENT_SELECTION: "Recruitment & Selection Section",
        APPOINTMENT: "Appointment Section",
        PLANNING_RESEARCH: "Planning & Research Section",
        MONITORING_EVALUATION: "Monitoring & Evaluation Section",
        INFORMATION_MANAGEMENT: "Information Management Section",
        PROJECTS: "Projects Section",
        SCHOLARSHIP: "Scholarship Section",
        TRAINING: "Training Section",
        BENEFITS: "Benefits Section",
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
            </SheetContent>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full">
                <div
                    className={cn(
                        "h-full flex flex-col bg-[#7b1113] text-[#f5d4d4] shadow-xl",
                        isExpanded ? "w-64" : "w-16"
                    )}
                >
                    {/* Logo Section with Toggle */}
                    <div
                        className={cn(
                            "flex items-center  border-b border-[#f5d4d4]/10 backdrop-blur-sm py-4",
                            isExpanded
                                ? "px-4 justify-between"
                                : "px-2 justify-center"
                        )}
                    >
                        <div className="flex items-center">
                            {isExpanded && (
                                <Image
                                    src="https://res.cloudinary.com/diedm9ddd/image/upload/v1750940289/HRDO_Logo_avvvsw.png"
                                    alt="HRDO Logo"
                                    width={isExpanded ? 60 : 30}
                                    height={isExpanded ? 60 : 30}
                                    className="rounded-full shadow-[0_0_30px_rgba(252,165,165,0.5)]"
                                />
                            )}

                            {isExpanded && (
                                <div className="ml-2">
                                    <h1 className="font-bold text-lg text-[#f5d4d4]">
                                        HRDO
                                    </h1>
                                    <p className="font-semibold text-xs text-[#f5d4d4]">
                                        CORE
                                    </p>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 w-8"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        {isApproved && (
                            <div className="space-y-2 py-4">
                                {navItems.map((item) => {
                                    if (
                                        item.roles &&
                                        !item.roles.includes(
                                            session?.user?.role as string
                                        )
                                    )
                                        return null;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="group"
                                            title={item.title}
                                        >
                                            <span
                                                className={cn(
                                                    "flex items-center py-3  rounded-lg",

                                                    isActive(item.href)
                                                        ? "bg-[#ff9e9e]"
                                                        : "group-hover:text-[#ff9e9e] ",
                                                    isExpanded
                                                        ? "justify-start mx-6 px-4"
                                                        : "justify-center mx-2 px-1"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "h-5 w-5 ",
                                                        isExpanded
                                                            ? "mr-2"
                                                            : "mr-0",
                                                        isActive(item.href)
                                                            ? "text-[#050617]"
                                                            : "text-[#f5d4d4] group-hover:text-[#ff9e9e]"
                                                    )}
                                                />
                                                {isExpanded && (
                                                    <span
                                                        className={cn(
                                                            "font-medium",
                                                            isActive(
                                                                item.href
                                                            ) &&
                                                                "text-[#050617]"
                                                        )}
                                                    >
                                                        {item.title}
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="mb-5 flex flex-col gap-2 border-t border-[#f5d4d4]/10 backdrop-blur-sm">
                        {isExpanded ? (
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                            >
                                <AccordionItem
                                    value="profile"
                                    className="border-b-0"
                                >
                                    <AccordionTrigger
                                        className={`flex items-center mt-4 ${
                                            isExpanded
                                                ? "mx-6 justify-between gap-2"
                                                : "mx-2 justify-center"
                                        }`}
                                    >
                                        <Image
                                            src={
                                                image
                                                    ? image
                                                    : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                            }
                                            alt="Item preview"
                                            className="w-10 h-10 object-cover rounded-full"
                                            width={80}
                                            height={80}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p
                                                title={
                                                    user ? formatName(user) : ""
                                                }
                                                className="text-[#f5d4d4] font-bold w-[154px] truncate no-underline"
                                            >
                                                {user ? formatName(user) : ""}
                                            </p>
                                            <p
                                                title={email ? email : ""}
                                                className="text-sm font-semibold w-[154px] truncate text-[#b86b6b] no-underline"
                                            >
                                                {email}
                                            </p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-col gap-2 border-t border-[#f5d4d4]/10 backdrop-blur-sm py-2 mt-4 mx-2">
                                            <span
                                                className="flex gap-2 justify-left items-center ms-2"
                                                title={
                                                    roleMap[
                                                        session?.user?.role ??
                                                            ""
                                                    ]
                                                }
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="flex flex-col">
                                                    <span className="text-[11px]">
                                                        Role
                                                    </span>
                                                    <span className="text-xs bg-red-500 rounded px-1 truncate max-w-[192px]">
                                                        {
                                                            roleMap[
                                                                session?.user
                                                                    ?.role ?? ""
                                                            ]
                                                        }
                                                    </span>
                                                </span>
                                            </span>
                                            <span
                                                className="flex gap-2 justify-left items-center ms-2"
                                                title={
                                                    divisionMap[
                                                        session?.user
                                                            ?.division ?? ""
                                                    ]
                                                }
                                            >
                                                <Building2 className="w-4 h-4" />
                                                <span className="flex flex-col">
                                                    <span className="text-[11px]">
                                                        Division
                                                    </span>
                                                    <span className="text-xs truncate w-[192px]">
                                                        {
                                                            divisionMap[
                                                                session?.user
                                                                    ?.division ??
                                                                    ""
                                                            ]
                                                        }
                                                    </span>
                                                </span>
                                            </span>
                                            <span
                                                className="flex gap-2 justify-left items-center ms-2"
                                                title={
                                                    sectionMap[
                                                        session?.user
                                                            ?.section ?? ""
                                                    ]
                                                }
                                            >
                                                <Users className="w-4 h-4" />
                                                <span className="flex flex-col">
                                                    <span className="text-[11px]">
                                                        Section
                                                    </span>
                                                    <span className="text-xs truncate w-[192px]">
                                                        {
                                                            sectionMap[
                                                                session?.user
                                                                    ?.section ??
                                                                    ""
                                                            ]
                                                        }
                                                    </span>
                                                </span>
                                            </span>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        ) : (
                            <div
                                className={`${
                                    isExpanded
                                        ? "mx-6 justify-between gap-2"
                                        : "mx-2 justify-center"
                                } flex items-center`}
                            >
                                <Image
                                    src={
                                        image
                                            ? image
                                            : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                    }
                                    alt="Item preview"
                                    className="w-10 h-10 object-cover rounded-full"
                                    width={80}
                                    height={80}
                                />
                            </div>
                        )}
                        <div
                            className={`${
                                isExpanded ? "mx-6" : "mx-2"
                            } flex items-center justify-center rounded-lg`}
                        >
                            <Button
                                title="Sign Out"
                                className="w-full bg-[#ff9e9e] text-[#050617]"
                                onClick={() => signOut()}
                            >
                                {isExpanded && "Sign Out"}
                                <LogOut
                                    className={`${
                                        isExpanded && "mx-2"
                                    } w-4 h-4`}
                                />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Sheet>
    );
}

// Mobile sidebar content
function SidebarContent() {
    const { data: session } = useSession();
    const isActive = useActivePath();
    const user = session?.user.name;
    const email = session?.user.email;
    const image = session?.user.image;
    const isApproved = session?.user.isApproved;
    const roleMap: Record<string, string> = {
        USER: "User",
        APPROVER: "Approver",
        ADMIN: "Admin",
    };
    const divisionMap: Record<string, string> = {
        ALL: "",
        MANAGEMENT: "Management",
        RECRUITMENT: "Recruitment Division",
        PLANNING_RESEARCH: "Planning & Research Division",
        DEVELOPMENT_BENEFITS: "Development & Benefits Division",
    };
    const sectionMap: Record<string, string> = {
        ALL: "All",
        EXECUTIVE: "Executive",
        ADMINISTRATIVE: "Administrative Section",
        RECRUITMENT_SELECTION: "Recruitment & Selection Section",
        APPOINTMENT: "Appointment Section",
        PLANNING_RESEARCH: "Planning & Research Section",
        MONITORING_EVALUATION: "Monitoring & Evaluation Section",
        INFORMATION_MANAGEMENT: "Information Management Section",
        PROJECTS: "Projects Section",
        SCHOLARSHIP: "Scholarship Section",
        TRAINING: "Training Section",
        BENEFITS: "Benefits Section",
    };

    return (
        <div className="h-full flex flex-col bg-[#7b1113] text-[#f5d4d4]">
            {/* Mobile Logo Section */}
            <div className="flex items-center p-4 border-b border-[#f5d4d4]/10 backdrop-blur-sm">
                <Image
                    src="https://res.cloudinary.com/diedm9ddd/image/upload/v1750940289/HRDO_Logo_avvvsw.png"
                    alt="HRDO Logo"
                    width={60}
                    height={60}
                />
                <div className="ml-2">
                    <h1 className="font-bold text-lg text-[#f5d4d4]">HRDO</h1>
                    <p className="font-semibold text-xs text-[#f5d4d4]">CORE</p>
                </div>
            </div>

            <ScrollArea className="flex-1">
                {isApproved && (
                    <div className="space-y-2 py-4">
                        {navItems.map((item) => {
                            if (
                                item.roles &&
                                !item.roles.includes(
                                    session?.user?.role as string
                                )
                            )
                                return null;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group"
                                >
                                    <span
                                        className={cn(
                                            "flex items-center py-3 rounded-lg",
                                            isActive(item.href)
                                                ? "bg-[#ff9e9e]"
                                                : "group-hover:text-[#ff9e9e]",
                                            "justify-start mx-6 px-4"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 mr-2",
                                                isActive(item.href)
                                                    ? "text-[#050617]"
                                                    : "text-gray-300 group-hover:text-[#ff9e9e]"
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                "font-medium",
                                                isActive(item.href) &&
                                                    "text-[#050617]"
                                            )}
                                        >
                                            {item.title}
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* User Profile Section */}
            <div className="mb-5 flex flex-col gap-2">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="profile" className="border-b-0">
                        <AccordionTrigger className="mx-6 flex items-center gap-2">
                            <Image
                                src={
                                    image
                                        ? image
                                        : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                }
                                alt="User profile"
                                className="w-10 h-10 object-cover rounded-full"
                                width={80}
                                height={80}
                            />
                            <div className="flex-1 min-w-0">
                                <p
                                    title={user ? formatName(user) : ""}
                                    className="text-[#f5d4d4] font-bold w-[154px] truncate no-underline"
                                >
                                    {user ? formatName(user) : ""}
                                </p>
                                <p
                                    title={email ? email : ""}
                                    className="text-sm font-semibold w-[154px] truncate text-[#b86b6b] no-underline"
                                >
                                    {email}
                                </p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="mb-2 flex flex-col gap-2 border-t border-[#f5d4d4]/10 backdrop-blur-sm pt-4 mt-2 mx-2">
                                <span
                                    className="flex gap-2 justify-left items-center ms-2"
                                    title={roleMap[session?.user?.role ?? ""]}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="flex flex-col">
                                        <span className="text-[11px]">
                                            Role
                                        </span>
                                        <span className="text-xs bg-red-500 rounded px-1 truncate max-w-[192px]">
                                            {roleMap[session?.user?.role ?? ""]}
                                        </span>
                                    </span>
                                </span>
                                <span
                                    className="flex gap-2 justify-left items-center ms-2"
                                    title={
                                        divisionMap[
                                            session?.user?.division ?? ""
                                        ]
                                    }
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="flex flex-col">
                                        <span className="text-[11px]">
                                            Division
                                        </span>
                                        <span className="text-xs truncate w-[192px]">
                                            {
                                                divisionMap[
                                                    session?.user?.division ??
                                                        ""
                                                ]
                                            }
                                        </span>
                                    </span>
                                </span>
                                <span
                                    className="flex gap-2 justify-left items-center ms-2"
                                    title={
                                        sectionMap[session?.user?.section ?? ""]
                                    }
                                >
                                    <Users className="w-4 h-4" />
                                    <span className="flex flex-col">
                                        <span className="text-[11px]">
                                            Section
                                        </span>
                                        <span className="text-xs truncate w-[192px]">
                                            {
                                                sectionMap[
                                                    session?.user?.section ?? ""
                                                ]
                                            }
                                        </span>
                                    </span>
                                </span>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div className="mx-6 flex items-center justify-center rounded-lg">
                    <Button
                        title="Sign Out"
                        className="w-full bg-[#ff9e9e] text-[#050617]"
                        onClick={() => signOut()}
                    >
                        Sign Out
                        <LogOut className="mx-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
