'use server'

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";

export async function createContentAction(slug: string, data: any) {
    try {
        await fetchServer(`/content/${slug}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        revalidatePath(`/dashboard/content/${slug}`);
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Create content error:', error);
        return { error: 'Failed to create content' };
    }
}

export async function updateContentAction(slug: string, id: string, data: any) {
    try {
        await fetchServer(`/content/${slug}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        revalidatePath(`/dashboard/content/${slug}`);
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Update content error:', error);
        return { error: 'Failed to update content' };
    }
}

export async function deleteContentAction(slug: string, id: string) {
    try {
        await fetchServer(`/content/${slug}/${id}`, {
            method: 'DELETE',
        });
        revalidatePath(`/dashboard/content/${slug}`);
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Delete content error:', error);
        return { error: 'Failed to delete content' };
    }
}
