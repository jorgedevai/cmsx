import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { SchemasTable } from "./_components/schemas-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconPlus, IconDatabase } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

export default async function SchemasPage() {
    const t = await getTranslations("schemas");
    let schemas = [];
    let error = null;
    try {
        schemas = await fetchServer("/schemas");
    } catch (e) {
        if (isRedirectError(e)) throw e;
        console.error("Failed to fetch schemas", e);
        error = t("failedLoad");
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("description")}
                    </p>
                </div>
                <Link href="/dashboard/schemas/new">
                    <Button size="sm" className="mt-3 sm:mt-0 w-fit">
                        <IconPlus className="size-4" />
                        {t("createSchema")}
                    </Button>
                </Link>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
            ) : (
                <SchemasTable initialSchemas={schemas} />
            )}
        </div>
    );
}
