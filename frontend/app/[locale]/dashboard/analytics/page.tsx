"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
    IconChartBar,
    IconApi,
    IconFileText,
    IconPhoto,
    IconClockHour3,
    IconAlertTriangle,
    IconArrowUp,
    IconActivity,
} from "@tabler/icons-react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import {
    getAnalyticsOverview,
    getApiUsageStats,
    getContentAnalytics,
    getAssetAnalytics,
} from "@/app/actions/analytics"

// ── Chart configs ──────────────────────────────────────────────────────

const requestsChartConfig = {
    count: { label: "Requests", color: "var(--primary)" },
} satisfies ChartConfig

const methodChartConfig = {
    GET: { label: "GET", color: "hsl(210 80% 55%)" },
    POST: { label: "POST", color: "hsl(150 60% 45%)" },
    PUT: { label: "PUT", color: "hsl(45 90% 55%)" },
    DELETE: { label: "DELETE", color: "hsl(0 70% 55%)" },
    PATCH: { label: "PATCH", color: "hsl(270 60% 55%)" },
} satisfies ChartConfig

const statusChartConfig = {
    "2xx": { label: "2xx", color: "hsl(150 60% 45%)" },
    "3xx": { label: "3xx", color: "hsl(210 80% 55%)" },
    "4xx": { label: "4xx", color: "hsl(45 90% 55%)" },
    "5xx": { label: "5xx", color: "hsl(0 70% 55%)" },
} satisfies ChartConfig

const contentChartConfig = {
    count: { label: "Entries", color: "var(--primary)" },
} satisfies ChartConfig

const assetChartConfig = {
    count: { label: "Uploads", color: "var(--primary)" },
} satisfies ChartConfig

const PIE_COLORS = [
    "hsl(210 80% 55%)",
    "hsl(150 60% 45%)",
    "hsl(45 90% 55%)",
    "hsl(0 70% 55%)",
    "hsl(270 60% 55%)",
    "hsl(30 80% 55%)",
    "hsl(180 60% 45%)",
    "hsl(330 70% 55%)",
]

// ── Types ──────────────────────────────────────────────────────────────

interface OverviewData {
    total_api_requests: number
    total_api_requests_today: number
    avg_response_time_ms: number
    error_rate: number
    total_content_entries: number
    total_assets: number
    total_users: number
    requests_by_day: { date: string; count: number }[]
}

interface ApiUsageData {
    total_requests: number
    requests_by_day: { date: string; count: number }[]
    requests_by_method: { method: string; count: number }[]
    requests_by_status: { status_code: number; count: number }[]
    top_endpoints: { path: string; count: number; avg_response_time_ms: number }[]
    avg_response_time_ms: number
    p95_response_time_ms: number
}

interface ContentAnalyticsData {
    total_entries: number
    entries_by_schema: { schema_name: string; schema_slug: string; count: number }[]
    entries_by_status: { status: string; count: number }[]
    created_by_day: { date: string; count: number }[]
}

interface AssetAnalyticsData {
    total_assets: number
    total_size_bytes: number
    assets_by_type: { content_type: string; count: number }[]
    uploads_by_day: { date: string; count: number }[]
    most_accessed: { filename: string; accesses: number }[]
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// ── Stat Card ──────────────────────────────────────────────────────────

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <Card className="@container/card">
            <CardHeader>
                <CardDescription className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    {title}
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {value}
                </CardTitle>
            </CardHeader>
        </Card>
    )
}

// ── Loading skeleton ───────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-20 mt-2" />
            </CardHeader>
        </Card>
    )
}

function ChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56 mt-1" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[250px] w-full" />
            </CardContent>
        </Card>
    )
}

// ── Page component ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const t = useTranslations("analytics")

    const [days, setDays] = React.useState(30)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const [overview, setOverview] = React.useState<OverviewData | null>(null)
    const [apiUsage, setApiUsage] = React.useState<ApiUsageData | null>(null)
    const [contentData, setContentData] = React.useState<ContentAnalyticsData | null>(null)
    const [assetData, setAssetData] = React.useState<AssetAnalyticsData | null>(null)

    const fetchData = React.useCallback(async (range: number) => {
        setLoading(true)
        setError(null)
        try {
            const [ov, api, content, assets] = await Promise.all([
                getAnalyticsOverview(range),
                getApiUsageStats(range),
                getContentAnalytics(),
                getAssetAnalytics(),
            ])
            setOverview(ov)
            setApiUsage(api)
            setContentData(content)
            setAssetData(assets)
        } catch {
            setError(t("failedLoad"))
        } finally {
            setLoading(false)
        }
    }, [t])

    React.useEffect(() => {
        fetchData(days)
    }, [days, fetchData])

    const hasNoData = !loading && !overview && !apiUsage && !contentData && !assetData

    return (
        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
                </div>
                <Select
                    value={String(days)}
                    onValueChange={(v) => setDays(Number(v))}
                >
                    <SelectTrigger className="w-40" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="7" className="rounded-lg">{t("last7Days")}</SelectItem>
                        <SelectItem value="30" className="rounded-lg">{t("last30Days")}</SelectItem>
                        <SelectItem value="90" className="rounded-lg">{t("last90Days")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
            )}

            {/* Empty state */}
            {hasNoData && !error && (
                <div className="rounded-xl border p-12 text-center">
                    <IconChartBar className="mx-auto size-10 text-muted-foreground/30" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">{t("noData")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("noDataHint")}</p>
                </div>
            )}

            {/* Main content */}
            {(!hasNoData || loading) && (
                <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
                        <TabsTrigger value="api">{t("apiUsage")}</TabsTrigger>
                        <TabsTrigger value="content">{t("contentMetrics")}</TabsTrigger>
                        <TabsTrigger value="assets">{t("assetMetrics")}</TabsTrigger>
                    </TabsList>

                    {/* ── Overview Tab ──────────────────────────────── */}
                    <TabsContent value="overview" className="flex flex-col gap-6">
                        {/* KPI cards */}
                        {loading ? (
                            <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <CardSkeleton key={i} />
                                ))}
                            </div>
                        ) : overview ? (
                            <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                                <StatCard
                                    title={t("totalRequests")}
                                    value={overview.total_api_requests.toLocaleString()}
                                    icon={IconActivity}
                                />
                                <StatCard
                                    title={t("requestsToday")}
                                    value={overview.total_api_requests_today.toLocaleString()}
                                    icon={IconArrowUp}
                                />
                                <StatCard
                                    title={t("avgResponseTime")}
                                    value={t("ms", { value: Math.round(overview.avg_response_time_ms) })}
                                    icon={IconClockHour3}
                                />
                                <StatCard
                                    title={t("errorRate")}
                                    value={t("percent", { value: (overview.error_rate * 100).toFixed(1) })}
                                    icon={IconAlertTriangle}
                                />
                            </div>
                        ) : null}

                        {/* Requests by day chart */}
                        {loading ? (
                            <ChartSkeleton />
                        ) : apiUsage?.requests_by_day?.length ? (
                            <Card className="@container/card">
                                <CardHeader>
                                    <CardTitle>{t("requestsByDay")}</CardTitle>
                                </CardHeader>
                                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                    <ChartContainer config={requestsChartConfig} className="aspect-auto h-[250px] w-full">
                                        <AreaChart data={apiUsage.requests_by_day}>
                                            <defs>
                                                <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={1.0} />
                                                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                minTickGap={32}
                                                tickFormatter={(value) =>
                                                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                }
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={
                                                    <ChartTooltipContent
                                                        labelFormatter={(value) =>
                                                            new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                        }
                                                        indicator="dot"
                                                    />
                                                }
                                            />
                                            <Area
                                                dataKey="count"
                                                type="natural"
                                                fill="url(#fillCount)"
                                                stroke="var(--color-count)"
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        ) : null}

                        {/* Top endpoints */}
                        {loading ? (
                            <ChartSkeleton />
                        ) : apiUsage?.top_endpoints?.length ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("topEndpoints")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-hidden rounded-lg border">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        {t("endpoint")}
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                                        {t("requests")}
                                                    </TableHead>
                                                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                                        {t("avgTime")}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {apiUsage.top_endpoints.map((ep) => (
                                                    <TableRow key={ep.path}>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                {ep.path}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right tabular-nums text-sm">
                                                            {ep.count.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                                            {t("ms", { value: Math.round(ep.avg_response_time_ms) })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}
                    </TabsContent>

                    {/* ── API Usage Tab ─────────────────────────────── */}
                    <TabsContent value="api" className="flex flex-col gap-6">
                        {loading ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                                    <ChartSkeleton />
                                    <ChartSkeleton />
                                </div>
                                <ChartSkeleton />
                            </>
                        ) : apiUsage ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                                    {/* Requests by method */}
                                    {apiUsage.requests_by_method?.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("requestsByMethod")}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ChartContainer config={methodChartConfig} className="aspect-auto h-[250px] w-full">
                                                    <BarChart data={apiUsage.requests_by_method}>
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis dataKey="method" tickLine={false} axisLine={false} tickMargin={8} />
                                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                            {apiUsage.requests_by_method.map((entry) => (
                                                                <Cell
                                                                    key={entry.method}
                                                                    fill={
                                                                        (methodChartConfig as Record<string, { color: string }>)[entry.method]?.color ??
                                                                        "var(--primary)"
                                                                    }
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Requests by status */}
                                    {apiUsage.requests_by_status?.length > 0 && (() => {
                                        const grouped = apiUsage.requests_by_status.reduce((acc, { status_code, count }) => {
                                            const key = `${Math.floor(status_code / 100)}xx`
                                            acc[key] = (acc[key] || 0) + count
                                            return acc
                                        }, {} as Record<string, number>)
                                        const statusData = Object.entries(grouped).map(([status, count]) => ({ status, count }))
                                        return (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("requestsByStatus")}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ChartContainer config={statusChartConfig} className="aspect-auto h-[250px] w-full">
                                                    <BarChart data={statusData}>
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
                                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                            {statusData.map((entry) => (
                                                                <Cell
                                                                    key={entry.status}
                                                                    fill={
                                                                        (statusChartConfig as Record<string, { color: string }>)[entry.status]?.color ??
                                                                        "var(--primary)"
                                                                    }
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>
                                        )
                                    })()}
                                </div>

                                {/* Requests by day (full width) */}
                                {apiUsage.requests_by_day?.length > 0 && (
                                    <Card className="@container/card">
                                        <CardHeader>
                                            <CardTitle>{t("requestsByDay")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                            <ChartContainer config={requestsChartConfig} className="aspect-auto h-[250px] w-full">
                                                <AreaChart data={apiUsage.requests_by_day}>
                                                    <defs>
                                                        <linearGradient id="fillCountApi" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={1.0} />
                                                            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        minTickGap={32}
                                                        tickFormatter={(value) =>
                                                            new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                        }
                                                    />
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={
                                                            <ChartTooltipContent
                                                                labelFormatter={(value) =>
                                                                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                                }
                                                                indicator="dot"
                                                            />
                                                        }
                                                    />
                                                    <Area
                                                        dataKey="count"
                                                        type="natural"
                                                        fill="url(#fillCountApi)"
                                                        stroke="var(--color-count)"
                                                    />
                                                </AreaChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Top endpoints table */}
                                {apiUsage.top_endpoints?.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{t("topEndpoints")}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-hidden rounded-lg border">
                                                <Table>
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow>
                                                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                                {t("endpoint")}
                                                            </TableHead>
                                                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                                                {t("requests")}
                                                            </TableHead>
                                                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                                                {t("avgTime")}
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {apiUsage.top_endpoints.map((ep) => (
                                                            <TableRow key={ep.path}>
                                                                <TableCell>
                                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                                        {ep.path}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right tabular-nums text-sm">
                                                                    {ep.count.toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                                                                    {t("ms", { value: Math.round(ep.avg_response_time_ms) })}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : null}
                    </TabsContent>

                    {/* ── Content Tab ───────────────────────────────── */}
                    <TabsContent value="content" className="flex flex-col gap-6">
                        {loading ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                                    <ChartSkeleton />
                                    <ChartSkeleton />
                                </div>
                                <ChartSkeleton />
                            </>
                        ) : contentData ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                                    {/* Entries by schema */}
                                    {contentData.entries_by_schema?.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("entriesBySchema")}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ChartContainer
                                                    config={contentChartConfig}
                                                    className="aspect-auto h-[250px] w-full"
                                                >
                                                    <BarChart data={contentData.entries_by_schema} layout="vertical">
                                                        <CartesianGrid horizontal={false} />
                                                        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
                                                        <YAxis
                                                            dataKey="schema_name"
                                                            type="category"
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickMargin={8}
                                                            width={100}
                                                        />
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Entries by status (pie chart) */}
                                    {contentData.entries_by_status?.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("entriesByStatus")}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex items-center justify-center">
                                                <ChartContainer config={contentChartConfig} className="aspect-square h-[250px]">
                                                    <PieChart>
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                        <Pie
                                                            data={contentData.entries_by_status}
                                                            dataKey="count"
                                                            nameKey="status"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={100}
                                                            label={({ status }) => status}
                                                        >
                                                            {contentData.entries_by_status.map((_, i) => (
                                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Content created over time */}
                                {contentData.created_by_day?.length > 0 && (
                                    <Card className="@container/card">
                                        <CardHeader>
                                            <CardTitle>{t("contentCreatedOverTime")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                            <ChartContainer config={contentChartConfig} className="aspect-auto h-[250px] w-full">
                                                <AreaChart data={contentData.created_by_day}>
                                                    <defs>
                                                        <linearGradient id="fillContent" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={1.0} />
                                                            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        minTickGap={32}
                                                        tickFormatter={(value) =>
                                                            new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                        }
                                                    />
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={
                                                            <ChartTooltipContent
                                                                labelFormatter={(value) =>
                                                                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                                }
                                                                indicator="dot"
                                                            />
                                                        }
                                                    />
                                                    <Area
                                                        dataKey="count"
                                                        type="natural"
                                                        fill="url(#fillContent)"
                                                        stroke="var(--color-count)"
                                                    />
                                                </AreaChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : null}
                    </TabsContent>

                    {/* ── Assets Tab ────────────────────────────────── */}
                    <TabsContent value="assets" className="flex flex-col gap-6">
                        {loading ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                                    <ChartSkeleton />
                                    <ChartSkeleton />
                                </div>
                            </>
                        ) : assetData ? (
                            <>
                                {/* KPI cards */}
                                <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                                    <StatCard
                                        title={t("totalAssets")}
                                        value={assetData.total_assets.toLocaleString()}
                                        icon={IconPhoto}
                                    />
                                    <StatCard
                                        title={t("totalSize")}
                                        value={formatBytes(assetData.total_size_bytes)}
                                        icon={IconPhoto}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                                    {/* Assets by type */}
                                    {assetData.assets_by_type?.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("assetsByType")}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex items-center justify-center">
                                                <ChartContainer config={assetChartConfig} className="aspect-square h-[250px]">
                                                    <PieChart>
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                        <Pie
                                                            data={assetData.assets_by_type}
                                                            dataKey="count"
                                                            nameKey="content_type"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={100}
                                                            label={({ content_type }) => content_type}
                                                        >
                                                            {assetData.assets_by_type.map((_, i) => (
                                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Uploads over time */}
                                    {assetData.uploads_by_day?.length > 0 && (
                                        <Card className="@container/card">
                                            <CardHeader>
                                                <CardTitle>{t("uploadsOverTime")}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                                <ChartContainer config={assetChartConfig} className="aspect-auto h-[250px] w-full">
                                                    <AreaChart data={assetData.uploads_by_day}>
                                                        <defs>
                                                            <linearGradient id="fillUploadsCount" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--color-count)" stopOpacity={1.0} />
                                                                <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickMargin={8}
                                                            minTickGap={32}
                                                            tickFormatter={(value) =>
                                                                new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                            }
                                                        />
                                                        <ChartTooltip
                                                            cursor={false}
                                                            content={
                                                                <ChartTooltipContent
                                                                    labelFormatter={(value) =>
                                                                        new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                                    }
                                                                    indicator="dot"
                                                                />
                                                            }
                                                        />
                                                        <Area
                                                            dataKey="count"
                                                            type="natural"
                                                            fill="url(#fillUploadsCount)"
                                                            stroke="var(--color-count)"
                                                        />
                                                    </AreaChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Most accessed table */}
                                {assetData.most_accessed?.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{t("mostAccessed")}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-hidden rounded-lg border">
                                                <Table>
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow>
                                                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                                {t("filename")}
                                                            </TableHead>
                                                            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                                                                {t("accesses")}
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {assetData.most_accessed.map((asset) => (
                                                            <TableRow key={asset.filename}>
                                                                <TableCell>
                                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                                        {asset.filename}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right tabular-nums text-sm">
                                                                    {asset.accesses.toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : null}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
