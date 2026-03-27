import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
    const t = await getTranslations("dashboard");
    const tc = await getTranslations("common");
    let stats = null;
    let error = null;
    try {
        stats = await fetchServer("/dashboard/stats");
    } catch (e) {
        if (isRedirectError(e)) throw e;
        console.error("Failed to fetch dashboard stats", e);
        error = t("failedStats");
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="mx-4 lg:mx-6 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tc("tryAgain")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards stats={stats} />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={stats?.activity_chart || []} />
            </div>
            <DataTable data={stats?.recent_activity || []} />
        </div>
    );
}
