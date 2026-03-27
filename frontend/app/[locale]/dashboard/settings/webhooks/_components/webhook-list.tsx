"use client";

import { useState } from "react";
import { IconPlus, IconWebhook, IconTrash } from "@tabler/icons-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { createWebhookAction, deleteWebhookAction, Webhook } from "@/app/actions/webhooks";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const AVAILABLE_EVENTS = [
    { id: "content.created", labelKey: "contentCreated" as const },
    { id: "content.updated", labelKey: "contentUpdated" as const },
    { id: "content.deleted", labelKey: "contentDeleted" as const },
    { id: "content.published", labelKey: "contentPublished" as const },
];

export function WebhookList({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
    const router = useRouter();
    const t = useTranslations("webhooks");
    const tc = useTranslations("common");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    async function handleCreate() {
        if (!name.trim() || !url.trim()) {
            toast.error(t("nameUrlRequired"));
            return;
        }
        if (selectedEvents.length === 0) {
            toast.error(t("selectEvent"));
            return;
        }

        try {
            await createWebhookAction({ name, url, events: selectedEvents });
            setIsCreateOpen(false);
            setName("");
            setUrl("");
            setSelectedEvents([]);
            toast.success(t("created"));
        } catch (error) {
            toast.error(t("createFailed"));
        }
    }

    async function handleDelete() {
        if (!webhookToDelete) return;
        try {
            await deleteWebhookAction(webhookToDelete);
            toast.success(t("deleted"));
            setWebhookToDelete(null);
        } catch (error) {
            toast.error(t("deleteFailed"));
        }
    }

    const toggleEvent = (eventId: string) => {
        if (selectedEvents.includes(eventId)) {
            setSelectedEvents(selectedEvents.filter(id => id !== eventId));
        } else {
            setSelectedEvents([...selectedEvents, eventId]);
        }
    };

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
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="mt-3 sm:mt-0 w-fit">
                            <IconPlus className="size-4" />
                            {t("createWebhook")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t("createTitle")}</DialogTitle>
                            <DialogDescription>
                                {t("createDescription")}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t("name")}</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder={t("namePlaceholder")} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="url">{t("payloadUrl")}</Label>
                                <Input id="url" value={url} onChange={e => setUrl(e.target.value)} placeholder={t("urlPlaceholder")} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t("events")}</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {AVAILABLE_EVENTS.map(event => (
                                        <div key={event.id} className="flex items-center space-x-2">
                                            <Switch
                                                id={event.id}
                                                checked={selectedEvents.includes(event.id)}
                                                onCheckedChange={() => toggleEvent(event.id)}
                                            />
                                            <Label htmlFor={event.id} className="cursor-pointer text-sm">{t(event.labelKey)}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleCreate} size="sm">
                                {tc("create")}
                            </Button>
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
                                {t("url")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("events")}
                            </TableHead>
                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {t("status")}
                            </TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialWebhooks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconWebhook className="size-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">
                                            {t("noWebhooks")}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {t("noWebhooksHint")}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialWebhooks.map((webhook) => (
                                <TableRow key={webhook.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                                <IconWebhook className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <span className="text-sm font-medium">
                                                {webhook.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <Badge
                                            variant="secondary"
                                            className="font-mono text-xs tracking-tight truncate max-w-full"
                                        >
                                            {webhook.url}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {webhook.events.map(e => (
                                                <Badge key={e} variant="outline" className="text-xs">
                                                    {e}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                                            {webhook.is_active ? t("active") : t("inactive")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setWebhookToDelete(webhook.id)}
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
                    {t("infoText", { header: "X-Webhook-Signature" })}
                </p>
            </div>

            {/* Delete dialog */}
            <AlertDialog open={!!webhookToDelete} onOpenChange={(open) => !open && setWebhookToDelete(null)}>
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
        </div>
    );
}
