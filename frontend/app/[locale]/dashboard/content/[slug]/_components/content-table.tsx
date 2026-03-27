"use client";

import { useState } from "react";
import Link from "next/link";
import {
    IconDotsVertical,
    IconFileText,
    IconTrash,
    IconPlus,
    IconArrowsSort,
    IconSortAscending,
    IconSortDescending,
    IconX,
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { deleteContentAction } from "@/app/actions/content";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface ContentTableProps {
    slug: string;
    schema: any;
    initialContents: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
    currentSort?: string;
    currentOrder?: string;
    currentStatus?: string;
}

export function ContentTable({
    slug,
    schema,
    initialContents,
    meta,
    currentSort,
    currentOrder,
    currentStatus
}: ContentTableProps) {
    const router = useRouter();
    const t = useTranslations("content");
    const tc = useTranslations("common");

    async function deleteContent(id: string) {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            const result = await deleteContentAction(slug, id);
            if (result.success) {
                toast.success(t("deleted"));
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(t("deleteFailed"));
        }
    }

    function updateParams(updates: Record<string, string | null>) {
        const params = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        if (updates.status || updates.sort_by) {
            params.set('page', '1');
        }
        router.push(`?${params.toString()}`);
    }

    function handleSort(column: string) {
        let newOrder = 'asc';
        if (currentSort === column && currentOrder === 'asc') {
            newOrder = 'desc';
        } else if (currentSort === column && currentOrder === 'desc') {
            newOrder = 'asc';
        }
        updateParams({ sort_by: column, order: newOrder });
    }

    function handleStatusFilter(status: string) {
        if (status === 'ALL') {
            updateParams({ status: null });
        } else {
            updateParams({ status });
        }
    }

    function clearFilters() {
        router.push(window.location.pathname);
    }

    const hasActiveFilters = currentStatus || currentSort;

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{schema.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("manage", { name: schema.name.toLowerCase() })}
                        {meta.total > 0 && ` ${t("totalItems", { total: meta.total })}`}
                    </p>
                </div>
                <Link href={`/dashboard/content/${slug}/new`}>
                    <Button size="sm" className="mt-3 sm:mt-0 w-fit">
                        <IconPlus className="size-4" />
                        {t("createNew")}
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Select
                    value={currentStatus || 'ALL'}
                    onValueChange={handleStatusFilter}
                >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder={t("allStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                        <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                        <SelectItem value="PUBLISHED">{t("published")}</SelectItem>
                        <SelectItem value="ARCHIVED">{t("archived")}</SelectItem>
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} size="sm" className="h-8">
                        <IconX className="size-3.5" />
                        {tc("reset")}
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {schema.fields.slice(0, 4).map((field: any) => (
                                <TableHead key={field.name} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {field.name}
                                </TableHead>
                            ))}
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('status')}
                                    className="-ml-4 h-8 text-xs font-medium uppercase tracking-wider"
                                >
                                    {t("status")}
                                    {currentSort === 'status' ? (
                                        currentOrder === 'asc' ? <IconSortAscending className="ml-1 size-3.5" /> : <IconSortDescending className="ml-1 size-3.5" />
                                    ) : (
                                        <IconArrowsSort className="ml-1 size-3.5" />
                                    )}
                                </Button>
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('created_at')}
                                    className="-ml-4 h-8 text-xs font-medium uppercase tracking-wider"
                                >
                                    {t("createdAt")}
                                    {currentSort === 'created_at' ? (
                                        currentOrder === 'asc' ? <IconSortAscending className="ml-1 size-3.5" /> : <IconSortDescending className="ml-1 size-3.5" />
                                    ) : (
                                        <IconArrowsSort className="ml-1 size-3.5" />
                                    )}
                                </Button>
                            </TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialContents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={schema.fields.length + 3} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconFileText className="size-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">
                                            {t("noContent")}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {t("noContentHint")}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialContents.map((content) => (
                                <TableRow key={content.id}>
                                    {schema.fields.slice(0, 4).map((field: any) => (
                                        <TableCell key={field.slug} className="max-w-[250px]">
                                            <span className="text-sm line-clamp-2">
                                                {formatCellValue(content.data[field.slug], field.field_type)}
                                            </span>
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <Badge variant={content.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                            {content.status || 'DRAFT'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                                        {format(new Date(content.created_at || content.createdAt || new Date()), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                                                    <IconDotsVertical className="size-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{tc("actions")}</DropdownMenuLabel>
                                                <Link href={`/dashboard/content/${slug}/${content.id}`}>
                                                    <DropdownMenuItem>{tc("edit")}</DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => deleteContent(content.id)}
                                                >
                                                    <IconTrash className="size-4" />
                                                    {tc("delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {tc("pageItems", { page: meta.page, totalPages: meta.total_pages, total: meta.total })}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page <= 1}
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (meta.page - 1).toString());
                                router.push(`?${params.toString()}`);
                            }}
                        >
                            <IconChevronLeft className="size-4" />
                            {tc("previous")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page >= meta.total_pages}
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (meta.page + 1).toString());
                                router.push(`?${params.toString()}`);
                            }}
                        >
                            {tc("next")}
                            <IconChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatCellValue(value: any, fieldType: string): string {
    if (value === null || value === undefined) return '-';

    if (fieldType === 'rich_text' || (typeof value === 'string' && value.startsWith('<'))) {
        const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 100 ? text.slice(0, 100) + '...' : text || '-';
    }

    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);

    const str = String(value);
    return str.length > 100 ? str.slice(0, 100) + '...' : str || '-';
}
