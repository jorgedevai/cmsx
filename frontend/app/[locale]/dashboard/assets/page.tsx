"use client";

import { useEffect, useState } from "react";
import {
    IconLoader2,
    IconCopy,
    IconCheck,
    IconTrash,
    IconFolder,
    IconFolderPlus,
    IconChevronRight,
    IconHome,
    IconArrowLeft,
    IconUpload,
    IconPhoto,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { AssetUpload } from "@/components/AssetUpload";
import { AssetGallery } from "@/components/asset-gallery";
import api from "@/lib/api";
import { deleteAssetAction } from "@/app/actions/assets";
import { useTranslations } from "next-intl";

interface Asset {
    id: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    created_at: string;
}

interface AssetFolder {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
}

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

export default function AssetsPage() {
    const t = useTranslations("assets");
    const tc = useTranslations("common");
    const [assets, setAssets] = useState<Asset[]>([]);
    const [folders, setFolders] = useState<AssetFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: t("home") }]);

    useEffect(() => {
        fetchContent();
    }, [currentFolderId]);

    async function fetchContent() {
        setLoading(true);
        try {
            const [assetsRes, foldersRes] = await Promise.all([
                api.get("/assets", { params: { folder_id: currentFolderId } }),
                api.get("/assets/folders", { params: { parent_id: currentFolderId } })
            ]);
            setAssets(assetsRes.data);
            setFolders(foldersRes.data);
        } catch (error) {
            console.error("Failed to fetch content", error);
            toast.error(t("failedLoad"));
        } finally {
            setLoading(false);
        }
    }

    const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';
    const handleCopyPath = (path: string, id: string) => {
        const fullPath = path.startsWith('http') ? path : `${ASSET_BASE}${path}`;
        navigator.clipboard.writeText(fullPath);
        setCopiedId(id);
        toast.success(t("pathCopied"));
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUploadComplete = () => {
        setIsUploadOpen(false);
        fetchContent();
    };

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await api.post("/assets/folders", {
                name: newFolderName,
                parent_id: currentFolderId
            });
            setNewFolderName("");
            setIsNewFolderOpen(false);
            toast.success(t("folderCreated"));
            fetchContent();
        } catch (error) {
            console.error(error);
            toast.error(t("folderCreateFailed"));
        }
    };

    const deleteAsset = async (id: string) => {
        if (!confirm(t("deleteFileConfirm"))) return;
        try {
            const result = await deleteAssetAction(id);
            if (result.success) {
                toast.success(t("fileDeleted"));
                fetchContent();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error(t("fileDeleteFailed"));
        }
    };

    const deleteFolder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t("deleteFolderConfirm"))) return;
        try {
            await api.delete(`/assets/folders/${id}`);
            toast.success(t("folderDeleted"));
            fetchContent();
        } catch (error) {
            console.error(error);
            toast.error(t("folderDeleteFailed"));
        }
    };

    const navigateToFolder = (folder: AssetFolder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
    };

    const navigateToBreadcrumb = (index: number) => {
        const target = breadcrumbs[index];
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(target.id);
    };

    const navigateUp = () => {
        if (breadcrumbs.length > 1) {
            navigateToBreadcrumb(breadcrumbs.length - 2);
        }
    };

    if (loading && assets.length === 0 && folders.length === 0) {
        return (
            <div className="flex h-[200px] w-full items-center justify-center">
                <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6 h-full">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div>
                    <nav className="flex items-center text-xs text-muted-foreground mb-1">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id || 'root'} className="flex items-center">
                                {index > 0 && <IconChevronRight className="size-3 mx-1" />}
                                <button
                                    onClick={() => navigateToBreadcrumb(index)}
                                    className={`hover:text-foreground hover:underline flex items-center gap-1 ${index === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""}`}
                                >
                                    {index === 0 && <IconHome className="size-3" />}
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </nav>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("description")}
                    </p>
                </div>

                <div className="flex gap-2 mt-3 sm:mt-0">
                    <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconFolderPlus className="size-4" />
                                {t("newFolder")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t("createFolder")}</DialogTitle>
                                <DialogDescription>
                                    {t("createFolderDescription")}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder={t("folderName")}
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={createFolder} size="sm">{tc("create")}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <IconUpload className="size-4" />
                                {t("uploadFile")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t("uploadAsset")}</DialogTitle>
                                <DialogDescription>
                                    {t("uploadingTo", { folder: breadcrumbs[breadcrumbs.length - 1].name })}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <AssetUpload onChange={handleUploadComplete} folderId={currentFolderId} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border p-4 space-y-6">
                {/* Back Button */}
                {currentFolderId && (
                    <div className="mb-4">
                        <Button variant="ghost" size="sm" onClick={navigateUp} className="text-muted-foreground">
                            <IconArrowLeft className="size-4" />
                            {tc("back")}
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {folders.length === 0 && assets.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                        <IconPhoto className="size-10 mb-4 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground font-medium">{t("emptyFolder")}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{t("emptyFolderHint")}</p>
                    </div>
                )}

                {/* Folders Grid */}
                {folders.length > 0 && (
                    <div>
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 px-1">{t("folders")}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {folders.map(folder => (
                                <div
                                    key={folder.id}
                                    onDoubleClick={() => navigateToFolder(folder)}
                                    className="group flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors relative"
                                >
                                    <IconFolder className="size-10 text-primary/60 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium text-center truncate w-full px-2" title={folder.name}>
                                        {folder.name}
                                    </span>

                                    <button
                                        onClick={(e) => deleteFolder(folder.id, e)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded text-destructive transition-opacity"
                                    >
                                        <IconTrash className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Assets Gallery */}
                {assets.length > 0 && (
                    <div className="mt-8">
                        <AssetGallery
                            assets={assets}
                            onDelete={deleteAsset}
                            onCopyPath={(asset) => handleCopyPath(asset.path, asset.id)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
