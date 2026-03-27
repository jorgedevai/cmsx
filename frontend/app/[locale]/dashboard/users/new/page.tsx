"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createUserAction } from "@/app/actions/users";
import { useTranslations } from "next-intl";

export default function NewUserPage() {
    const router = useRouter();
    const t = useTranslations("users");
    const tc = useTranslations("common");
    const tv = useTranslations("validation");

    const formSchema = z.object({
        username: z.string().min(3, tv("usernameMin")),
        email: z.string().email(tv("emailRequired")),
        password: z.string().min(8, tv("passwordMin8")),
        role: z.enum(["Admin", "Editor", "Viewer"]),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            role: "Viewer",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await createUserAction(values);
            if (result.success) {
                toast.success(t("created"));
                router.push("/dashboard/users");
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(t("createFailed"));
        }
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6 max-w-lg">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{t("addTitle")}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("addDescription")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">{t("userDetails")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">{t("username")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="johndoe" {...field} />
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
                                        <FormLabel className="text-xs font-medium">{t("email")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@example.com" type="email" {...field} />
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
                                        <FormLabel className="text-xs font-medium">{t("password")}</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">{t("role")}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectRole")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Admin">{t("roleAdmin")}</SelectItem>
                                                <SelectItem value="Editor">{t("roleEditor")}</SelectItem>
                                                <SelectItem value="Viewer">{t("roleViewer")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                                    {tc("cancel")}
                                </Button>
                                <Button type="submit" size="sm">
                                    {t("createUser")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
