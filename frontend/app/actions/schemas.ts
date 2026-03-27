'use server'

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";

export async function createSchemaAction(data: any) {
    try {
        await fetchServer("/schemas", {
            method: 'POST',
            body: JSON.stringify(data),
        });
        revalidatePath('/dashboard/schemas');
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Create schema error:', error);
        return { error: 'Failed to create schema' };
    }
}

export async function deleteSchemaAction(slug: string) {
    try {
        await fetchServer(`/schemas/${slug}`, {
            method: 'DELETE',
        });
        revalidatePath('/dashboard/schemas');
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Delete schema error:', error);
        return { error: 'Failed to delete schema' };
    }
}
