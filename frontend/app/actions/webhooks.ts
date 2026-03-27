"use server";

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";

export interface Webhook {
    id: string;
    name: string;
    url: string;
    secret: string;
    events: string[];
    is_active: boolean;
    created_at: string;
}

export async function listWebhooksAction(): Promise<Webhook[]> {
    try {
        const data = await fetchServer("/webhooks");
        return data;
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to list webhooks:", error);
        return [];
    }
}

export async function createWebhookAction(data: { name: string; url: string; events: string[] }) {
    try {
        const result = await fetchServer("/webhooks", {
            method: "POST",
            body: JSON.stringify(data),
        });
        revalidatePath("/dashboard/settings/webhooks");
        return result;
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to create webhook:", error);
        throw error;
    }
}

export async function deleteWebhookAction(id: string) {
    try {
        await fetchServer(`/webhooks/${id}`, {
            method: "DELETE",
        });
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to delete webhook:", error);
        throw error;
    }
    revalidatePath("/dashboard/settings/webhooks");
}
