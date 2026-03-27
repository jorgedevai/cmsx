"use client";

import Link from "next/link";
import { IconTrash, IconDatabase, IconExternalLink } from "@tabler/icons-react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteSchemaAction } from "@/app/actions/schemas";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Schema {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export function SchemasTable({ initialSchemas }: { initialSchemas: Schema[] }) {
    const router = useRouter();
    const [schemaToDelete, setSchemaToDelete] = useState<string | null>(null);
    const t = useTranslations("schemas");
    const tc = useTranslations("common");

    async function handleDelete() {
        if (!schemaToDelete) return;
        try {
            const result = await deleteSchemaAction(schemaToDelete);
            if (result.success) {
                toast.success(t("deleted"));
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(t("deleteFailed"));
        } finally {
            setSchemaToDelete(null);
        }
    }

    return (
        <>
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("name")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("slug")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("created")}
                            </TableHead>
                            <TableHead className="w-[120px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialSchemas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconDatabase className="size-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">
                                            {t("noSchemas")}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {t("noSchemasHint")}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialSchemas.map((schema) => (
                                <TableRow key={schema.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                                <IconDatabase className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <span className="text-sm font-medium">
                                                {schema.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="font-mono text-xs tracking-tight"
                                        >
                                            {schema.slug}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                                        {format(new Date(schema.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/dashboard/content/${schema.slug}`}>
                                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                                                    <IconExternalLink className="size-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setSchemaToDelete(schema.slug)}
                                            >
                                                <IconTrash className="size-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="rounded-lg border border-dashed p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("infoText")}
                </p>
            </div>

            <AlertDialog
                open={!!schemaToDelete}
                onOpenChange={(open) => !open && setSchemaToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            {tc("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
