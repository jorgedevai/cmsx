import { AIGenerator } from "@/components/ai-generator";

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-5rem)] flex flex-col px-4 py-4 md:py-6 lg:px-6">
            <AIGenerator />
        </div>
    );
}
