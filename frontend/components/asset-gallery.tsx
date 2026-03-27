"use client";

import {
    motion,
    LayoutGroup,
    AnimatePresence,
    type Transition,
} from "motion/react";
import {
    Playlist01Icon,
    GridViewIcon,
    Layers01Icon,
    File01Icon,
    Image01Icon,
    VideoReplayIcon,
    MusicNote01Icon,
    Delete02Icon,
    Copy01Icon,
    Tick02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { format } from "date-fns";

export interface Asset {
    id: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    created_at: string;
}

interface AssetGalleryProps {
    assets: Asset[];
    onDelete: (id: string) => void;
    onCopyPath: (asset: Asset) => void;
}

type ViewMode = "list" | "card" | "pack";

const snappySpring: Transition = {
    type: "spring",
    stiffness: 350,
    damping: 30,
    mass: 1,
};

const fastFade: Transition = {
    duration: 0.1,
    ease: "linear",
};

export function AssetGallery({ assets, onDelete, onCopyPath }: AssetGalleryProps) {
    const [view, setView] = useState<ViewMode>("card");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (asset: Asset) => {
        onCopyPath(asset);
        setCopiedId(asset.id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    const getIcon = (mime: string) => {
        if (mime.startsWith('image')) return Image01Icon;
        if (mime.startsWith('video')) return VideoReplayIcon;
        if (mime.startsWith('audio')) return MusicNote01Icon;
        return File01Icon;
    };

    const getImageUrl = (asset: Asset) => {
        if (asset.mimetype.startsWith('image')) {
            const base = process.env.NEXT_PUBLIC_ASSET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';
            return asset.path.startsWith('http') ? asset.path : `${base}${asset.path}`;
        }
        return null; // No image for non-images
    }

    return (
        <div className="w-full font-sans">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Gallery View
                    </h2>

                    <div className="flex p-1 bg-muted rounded-lg w-fit border border-border">
                        <Tab
                            active={view === "list"}
                            onClick={() => setView("list")}
                            icon={Playlist01Icon}
                            label="List"
                        />
                        <Tab
                            active={view === "card"}
                            onClick={() => setView("card")}
                            icon={GridViewIcon}
                            label="Grid"
                        />
                        <Tab
                            active={view === "pack"}
                            onClick={() => setView("pack")}
                            icon={Layers01Icon}
                            label="Stack"
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="relative min-h-[350px] flex flex-col items-center">
                    <LayoutGroup>
                        <motion.div
                            layout
                            transition={snappySpring}
                            className={cn(
                                "w-full relative",
                                view === "list" && "flex flex-col gap-3",
                                view === "card" && "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4",
                                view === "pack" && "h-96 flex items-center justify-center mt-12"
                            )}
                        >
                            {assets.map((item, index) => {
                                const imageUrl = getImageUrl(item);
                                const Icon = getIcon(item.mimetype);

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        transition={snappySpring}
                                        className={cn(
                                            "relative flex items-center z-10 group",
                                            view === "list" && "flex-row gap-4 w-full bg-card border rounded-xl p-2 hover:bg-muted/50 transition-colors",
                                            view === "card" && "flex-col gap-3 w-full items-start bg-card border rounded-2xl p-3 hover:shadow-md transition-shadow",
                                            view === "pack" &&
                                            "absolute w-64 h-80 items-center justify-center bg-card border rounded-3xl shadow-xl p-4"
                                        )}
                                        style={{
                                            zIndex: view === "pack" ? assets.length - index : 1,
                                        }}
                                        animate={
                                            view === "pack"
                                                ? {
                                                    rotate: index % 2 === 0 ? -2 * (index % 5) : 2 * (index % 5), // Random-ish rotation
                                                    x: (index % 5) * 5,
                                                    y: (index % 5) * 2,
                                                }
                                                : {
                                                    rotate: 0,
                                                    x: 0,
                                                    y: 0,
                                                }
                                        }
                                    >
                                        <motion.div
                                            layout
                                            transition={snappySpring}
                                            className={cn(
                                                "relative overflow-hidden shrink-0 bg-muted/30 flex items-center justify-center",
                                                view === "list" &&
                                                "w-12 h-12 rounded-lg border border-border/50 ",
                                                view === "card" &&
                                                "w-full aspect-square rounded-xl border border-border/50",
                                                view === "pack" &&
                                                "w-full h-48 rounded-2xl border border-border/50 mb-4"
                                            )}
                                        >
                                            {imageUrl ? (
                                                <motion.img
                                                    layout
                                                    transition={snappySpring}
                                                    src={imageUrl}
                                                    alt={item.filename}
                                                    className={cn(
                                                        "w-full h-full object-cover block",
                                                    )}
                                                />
                                            ) : (
                                                <HugeiconsIcon icon={Icon} size={view === "list" ? 20 : 40} className="text-muted-foreground/50" />
                                            )}
                                        </motion.div>

                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {/* Info Section */}
                                            <motion.div
                                                key={`${item.id}-info`}
                                                layout
                                                className={cn(
                                                    "flex flex-1 justify-between items-center min-w-0 w-full",
                                                    view === "card" ? "px-1" : "px-0"
                                                )}
                                            >
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <motion.h3
                                                        layout
                                                        className="font-medium text-sm text-foreground leading-tight truncate"
                                                        title={item.filename}
                                                    >
                                                        {item.filename}
                                                    </motion.h3>
                                                    <motion.div
                                                        layout
                                                        className="text-muted-foreground font-medium text-xs flex items-center gap-1.5"
                                                    >
                                                        <span className="truncate">{(item.size / 1024).toFixed(1)} KB</span>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                        <span className="truncate">{format(new Date(item.created_at), 'MMM d')}</span>
                                                    </motion.div>
                                                </div>

                                                {/* Actions */}
                                                <motion.div
                                                    layout
                                                    className={cn(
                                                        "flex items-center gap-1",
                                                        view === 'list' ? "opacity-0 group-hover:opacity-100 transition-opacity" : "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-lg p-1 shadow-sm border"
                                                    )}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCopy(item); }}
                                                        className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-md transition-colors text-muted-foreground"
                                                        title="Copy Link"
                                                    >
                                                        <HugeiconsIcon icon={copiedId === item.id ? Tick02Icon : Copy01Icon} size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                                        className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground"
                                                        title="Delete"
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                                                    </button>
                                                </motion.div>
                                            </motion.div>
                                        </AnimatePresence>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    </LayoutGroup>
                </div>
            </div>
        </div>
    );
}

function Tab({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium uppercase transition-all rounded-md outline-none",
                active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            {active && (
                <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-primary rounded-md shadow-sm"
                    transition={snappySpring}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">
                <HugeiconsIcon
                    icon={icon}
                    size={14}
                    className={cn(
                        "transition-transform duration-300",
                        active && "scale-110"
                    )}
                />
                <span className="hidden sm:inline">{label}</span>
            </span>
        </button>
    );
}
