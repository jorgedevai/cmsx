"use client";

import Link from "next/link";
import { IconUser, IconDotsVertical, IconEdit, IconTrash, IconCopy, IconUsers } from "@tabler/icons-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deleteUserAction } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

export function UsersTable({ initialUsers }: { initialUsers: User[] }) {
    const router = useRouter();
    const t = useTranslations("users");
    const tc = useTranslations("common");

    async function deleteUser(id: string) {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            const result = await deleteUserAction(id);
            if (result.success) {
                toast.success(t("deleted"));
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error(t("deleteFailed"));
        }
    }

    return (
        <div className="overflow-hidden rounded-lg border">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("user")}
                        </TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("email")}
                        </TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("role")}
                        </TableHead>
                        <TableHead className="w-[60px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialUsers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <IconUsers className="size-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">
                                        {t("noUsers")}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60">
                                        {t("noUsersHint")}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        initialUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                            <IconUser className="size-3.5 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium">
                                            {user.username}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {user.email}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                                                <IconDotsVertical className="size-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{tc("actions")}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => {
                                                navigator.clipboard.writeText(user.id);
                                                toast.success(t("idCopied"));
                                            }}>
                                                <IconCopy className="size-4" />
                                                {tc("copyId")}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/users/${user.id}`} className="flex items-center cursor-pointer">
                                                    <IconEdit className="size-4" />
                                                    {tc("edit")}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => deleteUser(user.id)}
                                            >
                                                <IconTrash className="size-4" />
                                                {tc("delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
