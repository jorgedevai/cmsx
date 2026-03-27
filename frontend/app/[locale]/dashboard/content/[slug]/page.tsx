import { fetchServer } from "@/lib/api-server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ContentTable } from "./_components/content-table";
import { redirect } from "next/navigation";

export default async function ContentListPage(props: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ page?: string, limit?: string, sort_by?: string, order?: string, status?: string }>
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    let schema = null;
    let contents = [];
    let meta = { total: 0, page: 1, limit: 10, total_pages: 1 };

    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const limit = searchParams.limit ? parseInt(searchParams.limit) : 10;
    const sortBy = searchParams.sort_by;
    const order = searchParams.order;
    const status = searchParams.status;

    try {
        // Fetch schema details to know fields
        schema = await fetchServer(`/schemas/${params.slug}`);

        // Build query string
        const queryParams = new URLSearchParams();
        queryParams.set('page', page.toString());
        queryParams.set('limit', limit.toString());
        if (sortBy) queryParams.set('sort_by', sortBy);
        if (order) queryParams.set('order', order);
        if (status && status !== 'ALL') queryParams.set('status', status);

        // Fetch content list with pagination, sorting, and filtering
        const response = await fetchServer(`/content/${params.slug}?${queryParams.toString()}`);

        // Handle new response structure
        if (response.meta) {
            contents = response.data;
            meta = response.meta;
        } else {
            // Fallback for legacy or error
            contents = Array.isArray(response) ? response : [];
        }

    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Failed to fetch content data", error);
    }

    if (!schema) {
        return <div>Schema not found or error loading data.</div>;
    }

    return (
        <ContentTable
            slug={params.slug}
            schema={schema}
            initialContents={contents}
            meta={meta}
            currentSort={sortBy}
            currentOrder={order}
            currentStatus={status}
        />
    );
}
