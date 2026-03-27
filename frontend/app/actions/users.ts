'use server'

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";

export async function createUserAction(data: any) {
    try {
        const res = await fetchServer("/users", {
            method: 'POST',
            body: JSON.stringify(data),
        });
        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Create user error:', error);
        return { error: 'Failed to create user' };
    }
}

export async function updateUserAction(id: string, data: any) {
    try {
        await fetchServer(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Update user error:', error);
        return { error: 'Failed to update user' };
    }
}

export async function deleteUserAction(id: string) {
    try {
        await fetchServer(`/users/${id}`, {
            method: 'DELETE',
        });
        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Delete user error:', error);
        return { error: 'Failed to delete user' };
    }
}
