"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const t = useTranslations("auth");
    const tv = useTranslations("validation");

    const formSchema = z.object({
        email: z.string().email(tv("emailInvalid")),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await forgotPasswordAction(values.email);
            if (result.success) {
                toast.success(t("resetLinkSent"));
            } else {
                toast.error(result.error || t("errorToast"));
            }
        } catch {
            toast.error(t("errorToast"));
        }
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
                        <p className="text-lg">&ldquo;{t("forgotQuote")}&rdquo;</p>
                        <footer className="text-sm text-zinc-400">{t("forgotQuoteAuthor")}</footer>
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
                        <h1 className="text-2xl font-semibold tracking-tight">{t("forgotTitle")}</h1>
                        <p className="text-sm text-muted-foreground">{t("forgotDescription")}</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder={t("emailPlaceholder")} {...field} className="bg-transparent" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? t("sendingResetLink") : t("sendResetLink")}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-muted-foreground">
                        <button onClick={() => router.push("/login")} className="underline underline-offset-4 hover:text-primary">
                            {t("backToLogin")}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
