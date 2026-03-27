"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Box, Command, LayoutTemplate } from "lucide-react"; // Example logo icon
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
import { useAuthStore } from "@/store/auth";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const t = useTranslations("auth");
    const tv = useTranslations("validation");

    const formSchema = z.object({
        email: z.string().email(tv("emailInvalid")),
        password: z.string().min(1, tv("passwordRequired")),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await loginAction(values);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.success) {
                login(result.access_token, result.refresh_token, result.user);
                toast.success(t("welcomeToast"));
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(t("errorToast"));
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
                            &ldquo;{t("loginQuote")}&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">{t("loginQuoteAuthor")}</footer>
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
                            {t("welcomeBack")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t("signInDescription")}
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                {form.formState.isSubmitting ? t("signingIn") : t("signIn")}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-muted-foreground space-y-2">
                        <p>
                            <button onClick={() => router.push("/forgot-password")} className="underline underline-offset-4 hover:text-primary">
                                {t("forgotPassword")}
                            </button>
                        </p>
                        <p>
                            {t("noAccount")}{" "}
                            <button onClick={() => router.push("/register")} className="underline underline-offset-4 hover:text-primary">
                                {t("register")}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
