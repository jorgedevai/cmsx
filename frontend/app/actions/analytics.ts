'use server'

import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function getAnalyticsOverview(days: number = 30) {
    try {
        return await fetchServer(`/analytics/overview?days=${days}`);
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Failed to fetch analytics overview:', error);
        return null;
    }
}

export async function getApiUsageStats(days: number = 30) {
    try {
        return await fetchServer(`/analytics/api-usage?days=${days}`);
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Failed to fetch API usage stats:', error);
        return null;
    }
}

export async function getContentAnalytics() {
    try {
        return await fetchServer(`/analytics/content`);
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Failed to fetch content analytics:', error);
        return null;
    }
}

export async function getAssetAnalytics() {
    try {
        return await fetchServer(`/analytics/assets`);
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error('Failed to fetch asset analytics:', error);
        return null;
    }
}
