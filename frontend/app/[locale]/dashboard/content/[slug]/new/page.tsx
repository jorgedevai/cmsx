"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { ContentForm } from "../_components/content-form";

export default function NewContentPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [schema, setSchema] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchSchema();
        }
    }, [slug]);

    async function fetchSchema() {
        try {
            const response = await api.get(`/schemas/${slug}`);
            setSchema(response.data);
        } catch (error) {
            console.error("Failed to fetch schema", error);
            toast.error("Schema not found");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[200px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!schema) return <div>Schema not found</div>;

    return <ContentForm slug={slug} schema={schema} />;
}


