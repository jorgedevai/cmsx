"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import useMeasure from "react-use-measure";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import {
    UserIcon,
    LogoutIcon,
    Settings01Icon,
    Moon02Icon,
    Sun01Icon,
    Menu01Icon,
} from "@hugeicons/core-free-icons";

// Animation settings
const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeItem, setActiveItem] = useState("");
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [contentRef, contentBounds] = useMeasure();

    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleAction = (id: string) => {
        setActiveItem(id);

        if (id === "theme") {
            setTheme(theme === "dark" ? "light" : "dark");
            // Don't close on theme toggle to allow toggling back
            return;
        }

        if (id === "logout") {
            logout();
            router.push("/login");
            setIsOpen(false);
            return;
        }

        if (id === "profile") {
            // router.push("/dashboard/profile");
        }

        // Default close for other actions
        // setIsOpen(false);
    };

    const menuItems = [
        { id: "profile", label: user?.username || "Profile", icon: UserIcon },
        { id: "settings", label: "Settings", icon: Settings01Icon },
        { id: "divider", label: "", icon: null },
        {
            id: "theme",
            label: theme === "dark" ? "Light Mode" : "Dark Mode",
            icon: theme === "dark" ? Sun01Icon : Moon02Icon
        },
        { id: "logout", label: "Logout", icon: LogoutIcon },
    ];

    const openHeight = Math.max(40, Math.ceil(contentBounds.height));
    const openWidth = 220;

    return (
        <div ref={containerRef} className="relative h-10 w-10 z-50">
            <motion.div
                layout
                initial={false}
                animate={{
                    width: isOpen ? openWidth : 40,
                    height: isOpen ? openHeight : 40,
                    borderRadius: isOpen ? 12 : 20, // Circle to rounded rect
                }}
                transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 400,
                    mass: 0.8,
                }}
                className="absolute top-0 right-0 bg-popover border border-border shadow-lg overflow-hidden cursor-pointer origin-top-right backdrop-blur-sm"
                onClick={() => !isOpen && setIsOpen(true)}
            >
                <motion.div
                    initial={false}
                    animate={{
                        opacity: isOpen ? 0 : 1,
                        scale: isOpen ? 0.5 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        pointerEvents: isOpen ? "none" : "auto",
                    }}
                >
                    {/* User Avatar Placeholder or Icon */}
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.username?.charAt(0).toUpperCase() || <HugeiconsIcon icon={Menu01Icon} size={20} />}
                    </div>
                </motion.div>

                {/* Menu Content */}
                <div ref={contentRef}>
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                        }}
                        transition={{
                            duration: 0.2
                        }}
                        className="p-2"
                        style={{
                            pointerEvents: isOpen ? "auto" : "none",
                        }}
                    >
                        <ul className="flex flex-col gap-1 m-0 p-0 list-none">
                            {menuItems.map((item, index) => {
                                if (item.id === "divider") {
                                    return (
                                        <motion.hr
                                            key={`divider-${index}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: isOpen ? 1 : 0 }}
                                            className="border-border my-1"
                                        />
                                    );
                                }

                                const Icon = item.icon!;
                                const isActive = activeItem === item.id;
                                const isLogout = item.id === "logout";
                                const isHovered = hoveredItem === item.id;

                                return (
                                    <motion.li
                                        key={item.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{
                                            opacity: isOpen ? 1 : 0,
                                            x: isOpen ? 0 : 10,
                                        }}
                                        transition={{
                                            delay: isOpen ? 0.05 + index * 0.03 : 0,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 24
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAction(item.id);
                                        }}
                                        onMouseEnter={() => setHoveredItem(item.id)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`
                        relative flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
                        ${isLogout ? "text-red-500 hover:text-red-600" : "text-foreground"}
                        ${isHovered ? (isLogout ? "bg-red-50 dark:bg-red-900/20" : "bg-muted") : ""}
                    `}
                                    >
                                        <HugeiconsIcon icon={Icon} size={18} className="relative z-10" />
                                        <span className="font-medium relative z-10">{item.label}</span>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
