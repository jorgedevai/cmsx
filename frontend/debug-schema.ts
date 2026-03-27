import { fetchServer } from "@/lib/api-server";

async function testSchemaFetch() {
    try {
        console.log("Fetching schema 'product'...");
        const schema = await fetchServer("/schemas/product");
        console.log("Schema 'product':", schema);
    } catch (e: any) {
        console.error("Error fetching 'product':", e.message);
    }

    try {
        console.log("Listing all schemas...");
        const schemas = await fetchServer("/schemas");
        console.log("All Schemas:", schemas);
    } catch (e: any) {
        console.error("Error listing schemas:", e.message);
    }
}

// Mocking fetchServer environment for standalone execution is hard because it uses cookies/headers.
// Instead, I will assume the issue might be route registration order or something subtle.
