import { getSettingsAction } from "@/app/actions/settings";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { SettingsOverview } from "./_components/settings-overview";

export default async function SettingsPage() {
    let settings = null;
    try {
        settings = await getSettingsAction();
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch settings", error);
    }

    return <SettingsOverview settings={settings} />;
}
