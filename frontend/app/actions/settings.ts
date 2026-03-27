"use server";

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export interface SystemSettings {
    storage: {
        type: string;
        upload_dir: string | null;
        r2_bucket: string | null;
        r2_account_id: string | null;
        r2_public_url: string | null;
        r2_configured: boolean;
    };
    ai: {
        enabled: boolean;
        provider: string | null;
        has_api_key: boolean;
    };
    email: EmailSettings;
}

export interface EmailSettings {
    provider: string;
    from_address: string | null;
    configured: boolean;
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_user: string | null;
    has_api_key: boolean;
    frontend_url: string | null;
}

export async function getSettingsAction(): Promise<SystemSettings | null> {
    try {
        return await fetchServer("/settings");
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch settings:", error);
        return null;
    }
}

export async function getEmailSettingsAction(): Promise<EmailSettings | null> {
    try {
        return await fetchServer("/settings/email");
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch email settings:", error);
        return null;
    }
}

export async function updateEmailSettingsAction(data: {
    provider: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    api_key?: string;
    from_address?: string;
    frontend_url?: string;
}): Promise<{ success: boolean; data?: EmailSettings; error?: string }> {
    try {
        const result = await fetchServer("/settings/email", {
            method: "PUT",
            body: JSON.stringify(data),
        });
        return { success: true, data: result };
    } catch (error) {
        if (isRedirectError(error)) throw error;
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}

export async function testEmailAction(data: {
    provider: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    api_key?: string;
    from_address?: string;
    to: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const result = await fetchServer("/settings/email/test", {
            method: "POST",
            body: JSON.stringify(data),
        });
        return { success: true, message: result.message };
    } catch (error) {
        if (isRedirectError(error)) throw error;
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}
