"use client";

import { useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

interface AssetUploadProps {
    value?: string;
    onChange: (value: string) => void;
    folderId?: string | null;
    folderName?: string;
}

export function AssetUpload({ value, onChange, folderId, folderName }: AssetUploadProps) {
    const [uploading, setUploading] = useState(false);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        // Append folder_id BEFORE file to ensure robust parsing on backend if strict
        if (folderId) {
            formData.append("folder_id", folderId);
        } else if (folderName) {
            formData.append("folder_name", folderName);
        }
        formData.append("file", file);

        setUploading(true);
        try {
            const response = await api.post("/assets", formData, {
                headers: {
                    "Content-Type": undefined, // Let Axios auto-set with boundary
                },
            });
            onChange(response.data.path);
            toast.success("File uploaded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
        }
    }

    if (value) {
        return (
            <div className="relative w-full h-40 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value.startsWith('http') ? value : `${process.env.NEXT_PUBLIC_ASSET_URL || ''}${value}`} alt="Uploaded asset" className="object-contain h-full w-full" />
                ) : (
                    <div className="text-sm text-gray-500">{value}</div>
                )}
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => onChange("")}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                        </>
                    )}
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
        </div>
    );
}
