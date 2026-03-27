"use client";

import { useState, useEffect } from "react";
import {
    IconCloud,
    IconRobot,
    IconMail,
    IconCheck,
    IconX,
    IconFolder,
    IconSettings,
    IconSend,
    IconLoader2,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import type { SystemSettings, EmailSettings } from "@/app/actions/settings";
import { updateEmailSettingsAction, testEmailAction } from "@/app/actions/settings";

function StatusBadge({ active, label }: { active: boolean; label: string }) {
    return (
        <Badge variant={active ? "default" : "secondary"} className="gap-1 text-xs">
            {active ? <IconCheck className="size-3" /> : <IconX className="size-3" />}
            {label}
        </Badge>
    );
}

function SettingRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
        </div>
    );
}

function SettingCard({
    icon: Icon,
    title,
    description,
    badge,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-card">
            <div className="flex items-start gap-3 p-5 pb-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                    <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{title}</h3>
                        {badge}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
            </div>
            <div className="px-5 pb-5">
                {children}
            </div>
        </div>
    );
}

// ── Email Provider Card ──────────────────────────────────────────────

type Provider = "smtp" | "resend" | "sendgrid" | "none";

const PROVIDERS: { id: Provider; label: string; description: string }[] = [
    { id: "smtp", label: "SMTP", description: "Generic SMTP server" },
    { id: "resend", label: "Resend", description: "Resend API" },
    { id: "sendgrid", label: "SendGrid", description: "SendGrid API" },
    { id: "none", label: "Disabled", description: "No emails" },
];

function EmailProviderSelector({
    selected,
    onSelect,
}: {
    selected: Provider;
    onSelect: (p: Provider) => void;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROVIDERS.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className={`flex flex-col items-center gap-1 rounded-md border p-3 text-center transition-colors cursor-pointer ${
                        selected === p.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "hover:bg-muted/50"
                    }`}
                >
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">{p.description}</span>
                </button>
            ))}
        </div>
    );
}

function EmailConfigForm({
    emailSettings,
    onSaved,
}: {
    emailSettings: EmailSettings;
    onSaved: (settings: EmailSettings) => void;
}) {
    const t = useTranslations("settings");
    const [provider, setProvider] = useState<Provider>(
        (emailSettings.provider as Provider) || "none"
    );
    const [smtpHost, setSmtpHost] = useState(emailSettings.smtp_host || "");
    const [smtpPort, setSmtpPort] = useState(String(emailSettings.smtp_port || 587));
    const [smtpUser, setSmtpUser] = useState(emailSettings.smtp_user || "");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [fromAddress, setFromAddress] = useState(emailSettings.from_address || "");
    const [frontendUrl, setFrontendUrl] = useState(emailSettings.frontend_url || "");
    const [testTo, setTestTo] = useState("");
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Reset form fields when provider changes
    useEffect(() => {
        if (provider !== emailSettings.provider) {
            setSmtpHost("");
            setSmtpPort("587");
            setSmtpUser("");
            setSmtpPassword("");
            setApiKey("");
        }
    }, [provider]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        const result = await updateEmailSettingsAction({
            provider,
            ...(provider === "smtp" && {
                smtp_host: smtpHost,
                smtp_port: Number(smtpPort),
                smtp_user: smtpUser,
                smtp_password: smtpPassword,
            }),
            ...((provider === "resend" || provider === "sendgrid") && {
                api_key: apiKey,
            }),
            ...(provider !== "none" && { from_address: fromAddress }),
            frontend_url: frontendUrl || undefined,
        });
        setSaving(false);

        if (result.success && result.data) {
            setMessage({ type: "success", text: t("emailSaved") });
            onSaved(result.data);
        } else {
            setMessage({ type: "error", text: result.error || t("emailSaveFailed") });
        }
    };

    const handleTest = async () => {
        if (!testTo) return;
        setTesting(true);
        setMessage(null);
        const result = await testEmailAction({
            provider,
            ...(provider === "smtp" && {
                smtp_host: smtpHost,
                smtp_port: Number(smtpPort),
                smtp_user: smtpUser,
                smtp_password: smtpPassword,
            }),
            ...((provider === "resend" || provider === "sendgrid") && {
                api_key: apiKey,
            }),
            ...(provider !== "none" && { from_address: fromAddress }),
            to: testTo,
        });
        setTesting(false);

        if (result.success) {
            setMessage({ type: "success", text: result.message || t("emailTestSuccess") });
        } else {
            setMessage({ type: "error", text: result.error || t("emailTestFailed") });
        }
    };

    return (
        <div className="space-y-4">
            <EmailProviderSelector selected={provider} onSelect={setProvider} />

            {provider === "smtp" && (
                <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">{t("emailSmtpHost")}</label>
                            <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" className="h-8 text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{t("emailSmtpPort")}</label>
                            <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="h-8 text-xs" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t("emailSmtpUser")}</label>
                        <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="user@example.com" className="h-8 text-xs" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t("emailSmtpPassword")}</label>
                        <Input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="********" className="h-8 text-xs" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t("emailFromAddress")}</label>
                        <Input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="noreply@example.com" className="h-8 text-xs" />
                    </div>
                </div>
            )}

            {(provider === "resend" || provider === "sendgrid") && (
                <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t("emailApiKey")}</label>
                        <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={provider === "resend" ? "re_..." : "SG...."} className="h-8 text-xs font-mono" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{t("emailFromAddress")}</label>
                        <Input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="noreply@example.com" className="h-8 text-xs" />
                    </div>
                </div>
            )}

            {provider !== "none" && (
                <div className="rounded-md border bg-muted/30 p-3">
                    <label className="text-xs text-muted-foreground mb-1 block">{t("emailFrontendUrl")}</label>
                    <Input value={frontendUrl} onChange={(e) => setFrontendUrl(e.target.value)} placeholder="https://cms.example.com" className="h-8 text-xs" />
                    <p className="text-[10px] text-muted-foreground mt-1">{t("emailFrontendUrlHint")}</p>
                </div>
            )}

            {/* Test email */}
            {provider !== "none" && (
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">{t("emailTestTo")}</label>
                        <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="admin@example.com" className="h-8 text-xs" />
                    </div>
                    <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || !testTo} className="h-8 gap-1.5">
                        {testing ? <IconLoader2 className="size-3 animate-spin" /> : <IconSend className="size-3" />}
                        {t("emailTestButton")}
                    </Button>
                </div>
            )}

            {/* Messages */}
            {message && (
                <div className={`rounded-md px-3 py-2 text-xs ${message.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
                    {message.text}
                </div>
            )}

            {/* Save */}
            <Button size="sm" onClick={handleSave} disabled={saving} className="w-full h-8 gap-1.5">
                {saving ? <IconLoader2 className="size-3 animate-spin" /> : <IconCheck className="size-3" />}
                {t("emailSaveButton")}
            </Button>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────

export function SettingsOverview({ settings }: { settings: SystemSettings | null }) {
    const t = useTranslations("settings");
    const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(settings?.email ?? null);

    if (!settings) {
        return (
            <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
                </div>
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <IconSettings className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>
                </div>
            </div>
        );
    }

    const storageType = settings.storage.type;
    const isR2 = storageType === "r2";
    const currentEmail = emailSettings ?? settings.email;

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Storage */}
                <SettingCard
                    icon={isR2 ? IconCloud : IconFolder}
                    title={t("storageTitle")}
                    description={t("storageDescription")}
                    badge={
                        <Badge variant="outline" className="text-xs font-mono">
                            {isR2 ? "Cloudflare R2" : t("storageLocal")}
                        </Badge>
                    }
                >
                    <div className="rounded-md border bg-muted/30 px-3 py-1">
                        {isR2 ? (
                            <>
                                <SettingRow label={t("storageBucket")} value={settings.storage.r2_bucket || "—"} />
                                <SettingRow label={t("storageAccountId")} value={
                                    settings.storage.r2_account_id
                                        ? `${settings.storage.r2_account_id.slice(0, 8)}...`
                                        : "—"
                                } />
                                <SettingRow label={t("storagePublicUrl")} value={
                                    settings.storage.r2_public_url
                                        ? <span className="font-mono text-xs">{settings.storage.r2_public_url}</span>
                                        : "—"
                                } />
                                <SettingRow label={t("storageCredentials")} value={
                                    <StatusBadge active={settings.storage.r2_configured} label={settings.storage.r2_configured ? t("configured") : t("notConfigured")} />
                                } />
                            </>
                        ) : (
                            <>
                                <SettingRow label={t("storageDirectory")} value={
                                    <span className="font-mono text-xs">{settings.storage.upload_dir || "./uploads"}</span>
                                } />
                            </>
                        )}
                    </div>
                </SettingCard>

                {/* AI */}
                <SettingCard
                    icon={IconRobot}
                    title={t("aiTitle")}
                    description={t("aiDescription")}
                    badge={
                        <StatusBadge active={settings.ai.enabled} label={settings.ai.enabled ? t("enabled") : t("disabled")} />
                    }
                >
                    <div className="rounded-md border bg-muted/30 px-3 py-1">
                        <SettingRow label={t("aiProvider")} value={settings.ai.provider || "—"} />
                        <SettingRow label={t("aiApiKey")} value={
                            <StatusBadge active={settings.ai.has_api_key} label={settings.ai.has_api_key ? t("configured") : t("notConfigured")} />
                        } />
                    </div>
                </SettingCard>

                {/* Email — full-width interactive card */}
                <div className="md:col-span-2">
                    <SettingCard
                        icon={IconMail}
                        title={t("emailTitle")}
                        description={t("emailDescription")}
                        badge={
                            <StatusBadge
                                active={currentEmail.configured}
                                label={currentEmail.configured ? currentEmail.provider.toUpperCase() : t("noOp")}
                            />
                        }
                    >
                        <EmailConfigForm
                            emailSettings={currentEmail}
                            onSaved={(updated) => setEmailSettings(updated)}
                        />
                    </SettingCard>
                </div>

            </div>

            {/* Info */}
            <div className="rounded-lg border border-dashed p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("infoText")}
                </p>
            </div>
        </div>
    );
}
