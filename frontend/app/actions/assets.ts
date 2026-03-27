'use server'

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";

export async function deleteAssetAction(id: string) {
    try {
        await fetchServer(`/assets/${id}`, {
            method: 'DELETE',
        });
        revalidatePath('/dashboard/assets');
        return { success: true };
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error('Delete asset error:', error);
        return { error: 'Failed to delete asset' };
    }
}
