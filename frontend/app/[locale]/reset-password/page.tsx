"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const t = useTranslations("auth");
    const tv = useTranslations("validation");

    const formSchema = z.object({
        password: z
            .string()
            .min(12, tv("passwordMin"))
            .regex(/[A-Z]/, tv("passwordUppercase"))
            .regex(/[a-z]/, tv("passwordLowercase"))
            .regex(/[0-9]/, tv("passwordNumber"))
            .regex(/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/, tv("passwordSpecial")),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: tv("passwordsNoMatch"),
        path: ["confirmPassword"],
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!token) {
            toast.error(t("invalidResetToken"));
            return;
        }
        try {
            const result = await resetPasswordAction(token, values.password);
            if (result.success) {
                toast.success(t("passwordResetSuccess"));
                router.push("/login");
            } else {
                toast.error(result.error || t("errorToast"));
            }
        } catch {
            toast.error(t("errorToast"));
        }
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <h1 className="text-xl font-semibold">{t("invalidResetToken")}</h1>
                    <Button onClick={() => router.push("/forgot-password")}>{t("requestNewLink")}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="hidden bg-zinc-900 lg:flex flex-col relative text-white dark:border-r border-zinc-800">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium p-10">
                    <LayoutTemplate className="mr-2 h-6 w-6 text-indigo-500" />
                    CMSX
                </div>
                <div className="relative z-20 mt-auto p-10">
                    <blockquote className="space-y-2">
                        <p className="text-lg">&ldquo;{t("resetQuote")}&rdquo;</p>
                        <footer className="text-sm text-zinc-400">{t("resetQuoteAuthor")}</footer>
                    </blockquote>
                </div>
            </div>

            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto w-full max-w-[350px] space-y-6"
                >
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">{t("resetTitle")}</h1>
                        <p className="text-sm text-muted-foreground">{t("resetDescription")}</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="password" placeholder={t("newPasswordPlaceholder")} {...field} className="bg-transparent" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="password" placeholder={t("confirmPasswordPlaceholder")} {...field} className="bg-transparent" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? t("resettingPassword") : t("resetPassword")}
                            </Button>
                        </form>
                    </Form>
                </motion.div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
