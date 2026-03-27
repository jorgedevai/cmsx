import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { UsersTable } from "./_components/users-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

export default async function UsersPage() {
    const t = await getTranslations("users");
    let users = [];
    try {
        users = await fetchServer("/users");
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch users", error);
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("description")}
                    </p>
                </div>
                <Link href="/dashboard/users/new">
                    <Button size="sm" className="mt-3 sm:mt-0 w-fit">
                        <IconPlus className="size-4" />
                        {t("addUser")}
                    </Button>
                </Link>
            </div>

            <UsersTable initialUsers={users} />
        </div>
    );
}
