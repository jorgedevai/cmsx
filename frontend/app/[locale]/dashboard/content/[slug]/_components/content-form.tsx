"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssetUpload } from "@/components/AssetUpload";
import { createContentAction, updateContentAction } from "@/app/actions/content";
import { IconEye, IconPencil, IconHistory, IconClock, IconArrowBack } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/rich-text-editor').then(mod => mod.RichTextEditor), { ssr: false })

interface ContentFormProps {
    slug: string;
    schema: any;
    initialData?: any;
    initialStatus?: string;
    id?: string;
}

interface ContentVersion {
    id: string;
    version: number;
    status: string;
    changed_by: string;
    created_at: string;
}

export function ContentForm({ slug, schema, initialData, initialStatus, id }: ContentFormProps) {
    const router = useRouter();
    const t = useTranslations("content");
    const tc = useTranslations("common");
    const tv = useTranslations("validation");
    const isEdit = !!initialData;
    const [previewMode, setPreviewMode] = useState(false);
    const [publishAt, setPublishAt] = useState("");
    const [versions, setVersions] = useState<ContentVersion[]>([]);
    const [showVersions, setShowVersions] = useState(false);
    const [restoringVersion, setRestoringVersion] = useState(false);

    const defaultValues = initialData || schema.fields.reduce((acc: any, field: any) => {
        if (field.field_type === 'boolean') acc[field.slug] = false;
        else acc[field.slug] = '';
        return acc;
    }, {});

    const form = useForm({ defaultValues });
    const watchedValues = form.watch();

    // Load versions for edit mode
    useEffect(() => {
        if (isEdit && id) {
            api.get(`/content/${slug}/${id}/versions`).then(res => {
                setVersions(res.data?.data || []);
            }).catch(() => {});
        }
    }, [isEdit, id, slug]);

    async function onSubmit(data: any, status: string) {
        try {
            const payload: any = { ...data, status };
            // If scheduling, set publish_at and status to SCHEDULED
            if (publishAt && status === "PUBLISHED") {
                const scheduledDate = new Date(publishAt);
                if (scheduledDate > new Date()) {
                    payload.status = "SCHEDULED";
                    payload.publish_at = scheduledDate.toISOString();
                }
            }

            let result;
            if (isEdit && id) {
                result = await updateContentAction(slug, id, payload);
            } else {
                result = await createContentAction(slug, payload);
            }

            if (result.success) {
                toast.success(isEdit ? t("saved") : t("createdSuccess"));
                router.push(`/dashboard/content/${slug}`);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(t("saveFailed"));
        }
    }

    async function restoreVersion(versionNumber: number) {
        if (!id) return;
        setRestoringVersion(true);
        try {
            await api.post(`/content/${slug}/${id}/versions/${versionNumber}/restore`);
            toast.success(t("versionRestored", { version: versionNumber }));
            router.refresh();
            window.location.reload();
        } catch {
            toast.error(t("versionRestoreFailed"));
        } finally {
            setRestoringVersion(false);
        }
    }

    // Find special fields for preview layout
    const titleField = schema.fields.find((f: any) =>
        f.slug === 'title' || f.slug === 'titulo' || f.slug === 'name' || f.slug === 'nombre'
    );
    const imageField = schema.fields.find((f: any) =>
        f.field_type === 'image' || f.slug.includes('image') || f.slug.includes('cover') || f.slug.includes('imagen')
    );
    const richTextField = schema.fields.find((f: any) => f.field_type === 'rich_text');

    const API_BASE = process.env.NEXT_PUBLIC_ASSET_URL || '';

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6 w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold tracking-tight">
                    {isEdit ? t("editTitle", { name: schema.name }) : t("createTitle", { name: schema.name })}
                </h1>
                <div className="flex items-center gap-2">
                    {isEdit && versions.length > 0 && (
                        <Button
                            type="button"
                            variant={showVersions ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setShowVersions(!showVersions); setPreviewMode(false); }}
                            className="h-8 gap-1.5"
                        >
                            <IconHistory className="size-3.5" />
                            {t("history")} ({versions.length})
                        </Button>
                    )}
                    <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50">
                        <Button
                            type="button"
                            variant={!previewMode && !showVersions ? "default" : "ghost"}
                            size="sm"
                            onClick={() => { setPreviewMode(false); setShowVersions(false); }}
                            className="h-8 gap-1.5"
                        >
                            <IconPencil className="size-3.5" />
                            {t("editor")}
                        </Button>
                        <Button
                            type="button"
                            variant={previewMode ? "default" : "ghost"}
                            size="sm"
                            onClick={() => { setPreviewMode(true); setShowVersions(false); }}
                            className="h-8 gap-1.5"
                        >
                            <IconEye className="size-3.5" />
                            {t("preview")}
                        </Button>
                    </div>
                </div>
            </div>

            {showVersions ? (
                /* ==================== VERSION HISTORY ==================== */
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t("versionHistory")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {versions.map((v) => (
                                <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-muted-foreground">v{v.version}</span>
                                        <Badge variant="outline" className="text-[10px]">{v.status}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(v.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-xs"
                                        disabled={restoringVersion}
                                        onClick={() => restoreVersion(v.version)}
                                    >
                                        <IconArrowBack className="size-3" />
                                        {t("restore")}
                                    </Button>
                                </div>
                            ))}
                            {versions.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">{t("noVersions")}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : previewMode ? (
                /* ==================== PREVIEW MODE ==================== */
                <div className="space-y-6">
                    <Card>
                        <CardContent className="py-8 px-6 md:px-12">
                            <article className="prose prose-lg dark:prose-invert max-w-none">
                                {imageField && watchedValues[imageField.slug] && (
                                    <div className="not-prose mb-8 -mx-6 md:-mx-12">
                                        <img
                                            src={
                                                watchedValues[imageField.slug].startsWith('http')
                                                    ? watchedValues[imageField.slug]
                                                    : `${API_BASE}${watchedValues[imageField.slug]}`
                                            }
                                            alt={watchedValues[titleField?.slug] || 'Cover'}
                                            className="w-full max-h-[400px] object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                                {titleField && watchedValues[titleField.slug] && (
                                    <h1 className="text-4xl font-bold tracking-tight mb-2">{watchedValues[titleField.slug]}</h1>
                                )}
                                {schema.fields
                                    .filter((f: any) =>
                                        f.slug !== titleField?.slug && f.slug !== imageField?.slug &&
                                        f.slug !== richTextField?.slug && f.field_type !== 'rich_text' && watchedValues[f.slug]
                                    )
                                    .map((f: any) => (
                                        <div key={f.slug} className="not-prose text-sm text-muted-foreground mb-4">
                                            <span className="font-medium">{f.name}:</span>{' '}
                                            {f.field_type === 'boolean' ? (watchedValues[f.slug] ? 'Yes' : 'No')
                                                : f.field_type === 'date' ? new Date(watchedValues[f.slug]).toLocaleDateString()
                                                : String(watchedValues[f.slug])}
                                        </div>
                                    ))
                                }
                                {schema.fields.filter((f: any) => f.field_type === 'rich_text').map((f: any) => (
                                    <div key={f.slug} dangerouslySetInnerHTML={{ __html: watchedValues[f.slug] || '<p class="text-muted-foreground italic">No content yet...</p>' }} />
                                ))}
                                {!richTextField && schema.fields
                                    .filter((f: any) => f.field_type === 'text' && f.slug !== titleField?.slug && !f.slug.includes('image') && !f.slug.includes('cover') && watchedValues[f.slug])
                                    .map((f: any) => (<p key={f.slug}>{watchedValues[f.slug]}</p>))
                                }
                            </article>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setPreviewMode(false)}>{t("backToEditor")}</Button>
                        <Button type="button" variant="secondary" onClick={form.handleSubmit((data) => onSubmit(data, "DRAFT"))}>{t("saveDraft")}</Button>
                        <Button type="button" onClick={form.handleSubmit((data) => onSubmit(data, "PUBLISHED"))}>{isEdit ? t("updatePublish") : t("publish")}</Button>
                    </div>
                </div>
            ) : (
                /* ==================== EDITOR MODE ==================== */
                <Form {...form}>
                    <form className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("contentSection")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {schema.fields.map((field: any) => (
                                    <FormField
                                        key={field.slug}
                                        control={form.control}
                                        name={field.slug}
                                        rules={{ required: field.required ? `${field.name} is required` : false }}
                                        render={({ field: formField }) => (
                                            <FormItem>
                                                <FormLabel>{field.name}</FormLabel>
                                                <FormControl>
                                                    {renderInput(field, formField, schema.name)}
                                                </FormControl>
                                                {field.required && <FormDescription>{tv("required")}</FormDescription>}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        {/* Scheduling */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <IconClock className="size-4" />
                                    {t("scheduling")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">{t("publishAt")}</label>
                                    <Input
                                        type="datetime-local"
                                        value={publishAt}
                                        onChange={(e) => setPublishAt(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground">{t("publishAtHint")}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>{tc("cancel")}</Button>
                            <Button type="button" variant="secondary" onClick={form.handleSubmit((data) => onSubmit(data, "DRAFT"))}>{t("saveDraft")}</Button>
                            <Button type="button" onClick={form.handleSubmit((data) => onSubmit(data, "PUBLISHED"))}>
                                {publishAt && new Date(publishAt) > new Date() ? t("schedule") : isEdit ? t("updatePublish") : t("publish")}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
}

function renderInput(fieldDefinition: any, formField: any, schemaName?: string) {
    const { value, ...rest } = formField;
    const safeValue = value ?? '';

    switch (fieldDefinition.field_type) {
        case "rich_text":
            return (
                <RichTextEditor
                    value={formField.value || ""}
                    onChange={formField.onChange}
                    placeholder={`Enter ${fieldDefinition.name}...`}
                />
            );
        case "number":
            return <Input type="number" {...rest} value={safeValue} onChange={e => formField.onChange(Number(e.target.value))} />;
        case "date":
            return <Input type="date" {...rest} value={safeValue} />;
        case "boolean":
            return <div className="flex items-center space-x-2">
                <Checkbox checked={!!value} onCheckedChange={formField.onChange} />
                <label>Yes</label>
            </div>;
        case "image":
            return <AssetUpload value={safeValue} onChange={formField.onChange} folderName={schemaName} />;
        case "text":
        default:
            if (fieldDefinition.slug.includes("image") || fieldDefinition.slug.includes("file") || fieldDefinition.slug.includes("cover")) {
                return <AssetUpload value={safeValue} onChange={formField.onChange} folderName={schemaName} />;
            }
            return <Input placeholder={`Enter ${fieldDefinition.name}`} {...rest} value={safeValue} />;
    }
}
