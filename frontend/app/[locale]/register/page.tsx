"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Box, LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations("auth");
    const tv = useTranslations("validation");

    const formSchema = z.object({
        username: z.string().min(3, tv("usernameMin")),
        email: z.string().email(tv("emailRequired")),
        password: z
            .string()
            .min(12, tv("passwordMin"))
            .regex(/[A-Z]/, tv("passwordUppercase"))
            .regex(/[a-z]/, tv("passwordLowercase"))
            .regex(/[0-9]/, tv("passwordNumber"))
            .regex(
                /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~]/,
                tv("passwordSpecial")
            ),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await api.post("/auth/register", {
                ...values,
                role: "Admin", // For MVP/Demo purposes
            });
            toast.success(t("accountCreated"));
            router.push("/login");
        } catch (error: any) {
            console.error(error);
            toast.error(t("registrationFailed"));
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* Left Side - Brand/Art */}
            <div className="hidden bg-zinc-900 lg:flex flex-col relative text-white dark:border-r border-zinc-800">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium p-10">
                    <LayoutTemplate className="mr-2 h-6 w-6 text-indigo-500" />
                    CMSX
                </div>
                <div className="relative z-20 mt-auto p-10">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;{t("registerQuote")}&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">{t("registerQuoteAuthor")}</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto w-full max-w-[350px] space-y-6"
                >
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t("createAccount")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t("createAccountDescription")}
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder={t("usernamePlaceholder")}
                                                {...field}
                                                className="bg-transparent"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder={t("emailPlaceholder")}
                                                {...field}
                                                className="bg-transparent"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder={t("passwordPlaceholder")}
                                                {...field}
                                                className="bg-transparent"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? t("creatingAccount") : t("createAccountButton")}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>
                            {t("hasAccount")}{" "}
                            <button onClick={() => router.push("/login")} className="underline underline-offset-4 hover:text-primary">
                                {t("login")}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
