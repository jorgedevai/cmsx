import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ContentForm } from "../_components/content-form";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function EditContentPage(props: { params: Promise<{ slug: string, id: string }> }) {
    const t = await getTranslations("content");
    const params = await props.params;
    if (params.id === 'new') {
        let schema = null;
        try {
            schema = await fetchServer(`/schemas/${params.slug}`);
        } catch (error) {
            if (isRedirectError(error)) throw error;
            console.error("Failed to fetch schema", error);
        }

        if (!schema) return <div className="px-4 py-4 lg:px-6 text-sm text-muted-foreground">{t("schemaNotFound")}</div>;

        return (
            <ContentForm slug={params.slug} schema={schema} />
        );
    }

    let schema = null;
    let content = null;

    try {
        schema = await fetchServer(`/schemas/${params.slug}`);
        const response = await fetchServer(`/content/${params.slug}`);
        let contents = [];
        if (response.data) {
            contents = response.data;
        } else if (Array.isArray(response)) {
            contents = response;
        }
        content = contents.find((c: any) => c.id === params.id);
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch data", error);
    }

    if (!schema) return <div className="px-4 py-4 lg:px-6 text-sm text-muted-foreground">{t("schemaNotFound")}</div>;
    if (!content) return <div className="px-4 py-4 lg:px-6 text-sm text-muted-foreground">{t("contentNotFound")}</div>;

    return (
        <ContentForm slug={params.slug} schema={schema} initialData={content.data} initialStatus={content.status} id={params.id} />
    );
}
