import { SchemaWizard } from "@/components/schema-wizard";
import { getTranslations } from "next-intl/server";

export default async function NewSchemaPage() {
    const t = await getTranslations("schemas");

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{t("createNew")}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("createNewDescription")}
                </p>
            </div>
            <SchemaWizard />
        </div>
    );
}
