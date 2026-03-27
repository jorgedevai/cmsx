import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { UserEditForm } from "../_components/user-edit-form";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function EditUserPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const t = await getTranslations("users");
    let user = null;
    try {
        const users = await fetchServer("/users");
        user = users.find((u: any) => u.id === params.id);
    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch user", error);
    }

    if (!user) {
        redirect("/dashboard/users");
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6 max-w-lg">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{t("editUser")}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("editDescription")}
                </p>
            </div>

            <UserEditForm user={user} />
        </div>
    );
}
