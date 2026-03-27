"use client";

import { useRouter } from "next/navigation";
import { Database, FileText, Upload, Sparkles, Plus } from "lucide-react";
import ToolbarExpandable from "@/components/ui/toolbar-expandable";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export function QuickActionsToolbar() {
    const router = useRouter();
    const [schemas, setSchemas] = useState<any[]>([]);

    useEffect(() => {
        api.get("/schemas").then(res => setSchemas(res.data || [])).catch(() => {});
    }, []);

    const steps = [
        {
            id: "new-schema",
            title: "New Schema",
            description: "Create a new content type for your CMS.",
            icon: <Database className="h-4 w-4" />,
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Schemas define the structure of your content. Use the AI generator for quick setup.
                    </p>
                    <Button
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/dashboard/schemas/new")}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Schema
                    </Button>
                </div>
            ),
        },
        {
            id: "new-content",
            title: "New Content",
            description: "Add a new entry to one of your schemas.",
            icon: <FileText className="h-4 w-4" />,
            content: (
                <div className="space-y-3">
                    {schemas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No schemas yet. Create one first.
                        </p>
                    ) : (
                        <div className="grid gap-2">
                            {schemas.slice(0, 5).map((s: any) => (
                                <Button
                                    key={s.slug}
                                    variant="outline"
                                    size="sm"
                                    className="justify-start"
                                    onClick={() => router.push(`/dashboard/content/${s.slug}/new`)}
                                >
                                    <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    {s.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "upload",
            title: "Assets",
            description: "Manage your media library and uploads.",
            icon: <Upload className="h-4 w-4" />,
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Upload images, documents and other files to your media library.
                    </p>
                    <Button
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/dashboard/assets")}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Open Library
                    </Button>
                </div>
            ),
        },
        {
            id: "ai",
            title: "AI Assistant",
            description: "Generate content or schemas with AI.",
            icon: <Sparkles className="h-4 w-4" />,
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Use AI to generate schemas automatically or create rich content inside the editor.
                    </p>
                    <div className="grid gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => router.push("/dashboard/schemas/new")}
                        >
                            <Database className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            AI Schema Generator
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => router.push("/dashboard/chat")}
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            AI Chat
                        </Button>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <ToolbarExpandable steps={steps} />
        </div>
    );
}
