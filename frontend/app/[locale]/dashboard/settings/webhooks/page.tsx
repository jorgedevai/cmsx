import { listWebhooksAction } from "@/app/actions/webhooks";
import { WebhookList } from "./_components/webhook-list";

export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
    const webhooks = await listWebhooksAction();

    return <WebhookList initialWebhooks={webhooks} />;
}
