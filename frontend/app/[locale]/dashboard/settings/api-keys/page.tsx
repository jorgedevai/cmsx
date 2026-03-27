import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ApiKeysTable } from "./_components/api-keys-table";

export default async function ApiKeysPage() {
    let keys = [];
    try {
        keys = await fetchServer("/api-keys");
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch API keys", error);
    }

    return <ApiKeysTable initialKeys={keys} />;
}
