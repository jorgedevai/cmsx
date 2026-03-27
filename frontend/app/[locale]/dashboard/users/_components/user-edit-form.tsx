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
    FormDescription,
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
import { updateUserAction } from "@/app/actions/users";
import { useTranslations } from "next-intl";

interface UserEditFormProps {
    user: {
        id: string;
        username: string;
        email: string;
        role: "Admin" | "Editor" | "Viewer"; // Ensure type matches enum
    };
}

export function UserEditForm({ user }: UserEditFormProps) {
    const router = useRouter();
    const t = useTranslations("users");
    const tc = useTranslations("common");
    const tv = useTranslations("validation");

    const formSchema = z.object({
        username: z.string().min(3, tv("usernameMin")),
        email: z.string().email(tv("emailRequired")),
        password: z.string().optional(),
        role: z.enum(["Admin", "Editor", "Viewer"]),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: user.username,
            email: user.email,
            role: user.role,
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await updateUserAction(user.id, {
                ...values,
                password: values.password || undefined,
            });

            if (result.success) {
                toast.success(t("updated"));
                router.push("/dashboard/users");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(t("updateFailed"));
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("userDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("username")}</FormLabel>
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
                                    <FormLabel>{t("email")}</FormLabel>
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
                                    <FormLabel>{t("newPassword")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder={t("keepCurrent")} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        {t("newPasswordHint")}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("role")}</FormLabel>
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
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                {tc("cancel")}
                            </Button>
                            <Button type="submit">
                                {t("saveChanges")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
