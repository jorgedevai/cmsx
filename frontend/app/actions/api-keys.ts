'use server'

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";

export async function createApiKeyAction(data: any) {
    try {
        const result = await fetchServer("/api-keys", {
            method: 'POST',
            body: JSON.stringify(data),
        });
        revalidatePath('/dashboard/settings/api-keys');
        return { success: true, key: result };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Create API key error:', error);
        return { error: 'Failed to create API key' };
    }
}

export async function revokeApiKeyAction(id: string) {
    try {
        await fetchServer(`/api-keys/${id}`, {
            method: 'DELETE',
        });
        revalidatePath('/dashboard/settings/api-keys');
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Revoke API key error:', error);
        return { error: 'Failed to revoke API key' };
    }
}
