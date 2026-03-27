import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { format } from "date-fns";
import {
    IconHistory,
    IconChevronLeft,
    IconChevronRight,
    IconShield,
    IconFileText,
    IconUpload,
    IconTrash,
    IconLogin,
    IconUserPlus,
    IconKey,
    IconRotate,
    IconListDetails,
} from "@tabler/icons-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource: string;
    details: Record<string, unknown> | null;
    created_at: string;
}

interface AuditResponse {
    data: AuditLog[];
    meta: {
        total: number;
        limit: number;
        offset: number;
    };
}

const PAGE_SIZE = 25;

function getActionIcon(action: string) {
    const cls = "size-3.5";
    switch (action) {
        case "USER_LOGIN":
            return <IconLogin className={cls} />;
        case "USER_REGISTER":
            return <IconUserPlus className={cls} />;
        case "PASSWORD_RESET":
            return <IconKey className={cls} />;
        case "SESSION_REVOKE":
        case "SESSION_REVOKE_ALL":
            return <IconShield className={cls} />;
        case "CREATE_SCHEMA":
        case "DELETE_SCHEMA":
        case "CREATE_CONTENT":
        case "UPDATE_CONTENT":
        case "DELETE_CONTENT":
            return <IconFileText className={cls} />;
        case "RESTORE_VERSION":
            return <IconRotate className={cls} />;
        case "UPLOAD_ASSET":
            return <IconUpload className={cls} />;
        case "DELETE_ASSET":
            return <IconTrash className={cls} />;
        default:
            return <IconHistory className={cls} />;
    }
}

function getActionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
    if (action.startsWith("DELETE_") || action === "SESSION_REVOKE_ALL") return "destructive";
    if (action.startsWith("CREATE_") || action === "UPLOAD_ASSET" || action === "USER_REGISTER") return "default";
    if (action.startsWith("UPDATE_") || action === "RESTORE_VERSION") return "secondary";
    return "outline";
}

function formatDetails(details: Record<string, unknown> | null): string | null {
    if (!details) return null;
    return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
}

export default async function AuditPage({
    searchParams,
}: {
    searchParams: Promise<{ action?: string; page?: string }>;
}) {
    const t = await getTranslations("audit");
    const tc = await getTranslations("common");
    const params = await searchParams;
    const currentAction = params.action || "";

    const ACTION_TYPES = [
        { value: "", label: t("allActions") },
        { value: "USER_LOGIN", label: t("login") },
        { value: "USER_REGISTER", label: t("registration") },
        { value: "PASSWORD_RESET", label: t("passwordReset") },
        { value: "SESSION_REVOKE", label: t("sessionRevoke") },
        { value: "SESSION_REVOKE_ALL", label: t("revokeAllSessions") },
        { value: "CREATE_SCHEMA", label: t("createSchema") },
        { value: "DELETE_SCHEMA", label: t("deleteSchema") },
        { value: "CREATE_CONTENT", label: t("createContent") },
        { value: "UPDATE_CONTENT", label: t("updateContent") },
        { value: "DELETE_CONTENT", label: t("deleteContent") },
        { value: "RESTORE_VERSION", label: t("restoreVersion") },
        { value: "UPLOAD_ASSET", label: t("uploadAsset") },
        { value: "DELETE_ASSET", label: t("deleteAsset") },
    ];
    const currentPage = Math.max(1, parseInt(params.page || "1", 10));
    const offset = (currentPage - 1) * PAGE_SIZE;

    let logs: AuditLog[] = [];
    let total = 0;

    try {
        const queryParts: string[] = [`limit=${PAGE_SIZE}`, `offset=${offset}`];
        if (currentAction) {
            queryParts.push(`action=${encodeURIComponent(currentAction)}`);
        }
        const response: AuditResponse = await fetchServer(`/audit-logs?${queryParts.join("&")}`);
        logs = response.data;
        total = response.meta.total;
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch logs server-side", error);
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    function buildUrl(overrides: { action?: string; page?: number }) {
        const p = new URLSearchParams();
        const action = overrides.action !== undefined ? overrides.action : currentAction;
        const page = overrides.page !== undefined ? overrides.page : currentPage;
        if (action) p.set("action", action);
        if (page > 1) p.set("page", String(page));
        const qs = p.toString();
        return `/dashboard/audit${qs ? `?${qs}` : ""}`;
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("description")}
                        {total > 0 && ` ${t("totalEntries", { total })}`}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                {ACTION_TYPES.map((type) => (
                    <Link key={type.value} href={buildUrl({ action: type.value, page: 1 })}>
                        <Badge
                            variant={currentAction === type.value ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/80 hover:text-primary-foreground transition-colors text-xs"
                        >
                            {type.label}
                        </Badge>
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]" />
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("timeCol")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("actionCol")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("resourceCol")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("detailsCol")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("userCol")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconListDetails className="size-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">
                                            {t("noActivity")}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                            {getActionIcon(log.action)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getActionVariant(log.action)}>
                                            {log.action.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-xs tracking-tight max-w-[200px] truncate">
                                            {log.resource}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                                        {formatDetails(log.details) || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {log.user_id.slice(0, 8)}...
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {tc("showing", { from: offset + 1, to: Math.min(offset + PAGE_SIZE, total), total })}
                    </p>
                    <div className="flex items-center gap-2">
                        {currentPage > 1 ? (
                            <Link href={buildUrl({ page: currentPage - 1 })}>
                                <Button variant="outline" size="sm">
                                    <IconChevronLeft className="size-4" />
                                    {tc("previous")}
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled>
                                <IconChevronLeft className="size-4" />
                                {tc("previous")}
                            </Button>
                        )}

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                        acc.push("...");
                                    }
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === "..." ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-xs">
                                            ...
                                        </span>
                                    ) : (
                                        <Link key={p} href={buildUrl({ page: p as number })}>
                                            <Button
                                                variant={p === currentPage ? "default" : "outline"}
                                                size="sm"
                                                className="w-9"
                                            >
                                                {p}
                                            </Button>
                                        </Link>
                                    )
                                )}
                        </div>

                        {currentPage < totalPages ? (
                            <Link href={buildUrl({ page: currentPage + 1 })}>
                                <Button variant="outline" size="sm">
                                    {tc("next")}
                                    <IconChevronRight className="size-4" />
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled>
                                {tc("next")}
                                <IconChevronRight className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
