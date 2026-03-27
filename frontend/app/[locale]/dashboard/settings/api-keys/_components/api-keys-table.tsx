"use client";

import { useState } from "react";
import { IconPlus, IconKey, IconCopy, IconTrash, IconAlertTriangle } from "@tabler/icons-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { createApiKeyAction, revokeApiKeyAction } from "@/app/actions/api-keys";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
    expires_at?: string;
}

export function ApiKeysTable({ initialKeys }: { initialKeys: ApiKey[] }) {
    const router = useRouter();
    const t = useTranslations("apiKeys");
    const tc = useTranslations("common");
    const [newKeyName, setNewKeyName] = useState("");
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

    async function handleCreateKey() {
        if (!newKeyName.trim()) return;

        try {
            const result = await createApiKeyAction({ name: newKeyName });
            if (result.success) {
                setCreatedKey(result.key.key);
                setNewKeyName("");
                toast.success(t("created_toast"));
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(t("createFailed"));
        }
    }

    async function handleRevokeKey() {
        if (!keyToDelete) return;

        try {
            const result = await revokeApiKeyAction(keyToDelete);
            if (result.success) {
                toast.success(t("revoked"));
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(t("revokeFailed"));
        } finally {
            setKeyToDelete(null);
        }
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("description")}
                    </p>
                </div>
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) setCreatedKey(null);
                    }}
                >
                    <DialogTrigger asChild>
                        <Button size="sm" className="mt-3 sm:mt-0 w-fit">
                            <IconPlus className="size-4" />
                            {t("createKey")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("createTitle")}</DialogTitle>
                            <DialogDescription>
                                {t("createDescription")}
                            </DialogDescription>
                        </DialogHeader>

                        {!createdKey ? (
                            <div className="grid gap-4 py-4">
                                <Input
                                    placeholder={t("namePlaceholder")}
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateKey();
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="py-4 space-y-3">
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                                        <IconAlertTriangle className="size-4" />
                                        <span className="text-sm font-medium">
                                            {t("copyWarning")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mb-3 leading-relaxed">
                                        {t("copyWarningText")}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 break-all rounded-md bg-white/80 dark:bg-black/20 px-3 py-2 font-mono text-xs tracking-tight">
                                            {createdKey}
                                        </code>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="shrink-0 size-8"
                                            onClick={() => {
                                                navigator.clipboard.writeText(createdKey);
                                                toast.success(tc("copied"));
                                            }}
                                        >
                                            <IconCopy className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {!createdKey ? (
                                <Button
                                    onClick={handleCreateKey}
                                    disabled={!newKeyName.trim()}
                                    size="sm"
                                >
                                    {tc("create")}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setIsCreateOpen(false)}
                                    size="sm"
                                >
                                    {tc("done")}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("name")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("token")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("created")}
                            </TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconKey className="size-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">
                                            {t("noKeys")}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {t("noKeysHint")}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialKeys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                                <IconKey className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <span className="text-sm font-medium">
                                                {key.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="font-mono text-xs tracking-tight"
                                        >
                                            {key.prefix}...
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                                        {format(new Date(key.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setKeyToDelete(key.id)}
                                        >
                                            <IconTrash className="size-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-dashed p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("infoText", { header: "X-API-Key" })}
                </p>
            </div>

            {/* Revoke dialog */}
            <AlertDialog
                open={!!keyToDelete}
                onOpenChange={(open) => !open && setKeyToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("revokeTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("revokeDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleRevokeKey}
                        >
                            {t("revoke")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
