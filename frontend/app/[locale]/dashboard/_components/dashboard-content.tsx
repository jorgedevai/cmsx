"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Area, AreaChart, ResponsiveContainer, XAxis, YAxis,
    Tooltip as RechartsTooltip, CartesianGrid, Bar, BarChart,
} from "recharts";
import {
    Users, Database, FileText, Image,
    ArrowUpRight, ArrowDownRight, TrendingUp,
    LogIn, Edit, PlusCircle, Trash2, Activity,
    MoreHorizontal,
} from "lucide-react";
import { StatsFilter } from "@/components/stats-filter";

export function DashboardContent({ stats }: { stats: any }) {
    if (!stats) return null;

    const trends = {
        users: { value: "+12.5%", positive: true },
        schemas: { value: "+4.1%", positive: true },
        content: { value: "+21.2%", positive: true },
        assets: { value: "-2.3%", positive: false },
    };

    const metrics = [
        {
            label: "Total Users",
            value: stats.users || 0,
            trend: trends.users,
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            label: "Schemas",
            value: stats.schemas || 0,
            trend: trends.schemas,
            icon: Database,
            color: "text-indigo-500",
            bgColor: "bg-indigo-500/10",
        },
        {
            label: "Content Entries",
            value: stats.content || 0,
            trend: trends.content,
            icon: FileText,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
        },
        {
            label: "Assets",
            value: stats.assets || 0,
            trend: trends.assets,
            icon: Image,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Platform metrics and recent activity.
                    </p>
                </div>
                <StatsFilter />
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((m) => (
                    <MetricCard key={m.label} {...m} />
                ))}
            </div>

            {/* Charts + Feed */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Activity Chart */}
                <div className="lg:col-span-4 rounded-xl border bg-card p-0 overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div>
                            <h3 className="text-sm font-semibold">Activity</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Daily events over the last 30 days
                            </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono tracking-wider uppercase h-5">
                            30d
                        </Badge>
                    </div>
                    <div className="px-5 pb-5">
                        <ActivityChart data={stats.activity_chart || []} />
                    </div>
                </div>

                {/* Recent Feed */}
                <div className="lg:col-span-3 rounded-xl border bg-card p-0 overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div>
                            <h3 className="text-sm font-semibold">Recent Feed</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Latest actions across your system
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                    <Separator />
                    <ActivityFeed logs={stats.recent_activity || []} />
                </div>
            </div>
        </div>
    );
}

/* ─── Metric Card ──────────────────────────────────────────────── */

function MetricCard({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
    trend,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    trend?: { value: string; positive: boolean };
}) {
    return (
        <div className="rounded-xl border bg-card p-5 flex flex-col justify-between gap-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.06)] transition-all duration-300">
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted-foreground">
                    {label}
                </span>
                <div className={`${bgColor} ${color} rounded-lg p-2`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold tracking-tight tabular-nums">
                    {value.toLocaleString()}
                </div>
                {trend && (
                    <div className="flex items-center gap-1 mt-1.5">
                        <span
                            className={`inline-flex items-center text-xs font-semibold ${
                                trend.positive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-500 dark:text-red-400"
                            }`}
                        >
                            {trend.positive ? (
                                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                            ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                            )}
                            {trend.value}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Activity Chart ───────────────────────────────────────────── */

function ActivityChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No activity data yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.6}
                    />
                    <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
                        }}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <RechartsTooltip
                        contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                            padding: "8px 12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                        labelStyle={{
                            color: "hsl(var(--muted-foreground))",
                            fontSize: "11px",
                            marginBottom: "4px",
                        }}
                        labelFormatter={(label) => {
                            const d = new Date(label);
                            return d.toLocaleDateString("default", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            });
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        name="Events"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartFill)"
                        activeDot={{
                            r: 5,
                            fill: "hsl(var(--primary))",
                            stroke: "hsl(var(--background))",
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─── Activity Feed ────────────────────────────────────────────── */

function ActivityFeed({ logs }: { logs: any[] }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-5">
                <Activity className="h-8 w-8 text-muted-foreground mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Actions will appear here as they happen</p>
            </div>
        );
    }

    return (
        <div className="max-h-[360px] overflow-y-auto">
            {logs.map((log, i) => (
                <div
                    key={log.id}
                    className={`flex items-start gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors ${
                        i < logs.length - 1 ? "border-b border-border/50" : ""
                    }`}
                >
                    <div className="mt-1 shrink-0">
                        <div className={`rounded-full p-1.5 ${getActionStyle(log.action).bg}`}>
                            {getActionIcon(log.action)}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate leading-tight">
                                {formatAction(log.action)}
                            </p>
                            <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap shrink-0">
                                {formatTimeAgo(log.created_at)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1 leading-tight">
                            {log.resource}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function getActionStyle(action: string) {
    const a = action.toLowerCase();
    if (a.includes("login") || a.includes("auth"))
        return { bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-500" };
    if (a.includes("create") || a.includes("add"))
        return { bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400" };
    if (a.includes("delete") || a.includes("remove"))
        return { bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-500 dark:text-red-400" };
    if (a.includes("update") || a.includes("edit"))
        return { bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-500 dark:text-blue-400" };
    return { bg: "bg-muted", color: "text-muted-foreground" };
}

function getActionIcon(action: string) {
    const a = action.toLowerCase();
    const style = getActionStyle(action);
    const cls = `h-3.5 w-3.5 ${style.color}`;
    if (a.includes("login") || a.includes("auth")) return <LogIn className={cls} />;
    if (a.includes("create") || a.includes("add")) return <PlusCircle className={cls} />;
    if (a.includes("delete") || a.includes("remove")) return <Trash2 className={cls} />;
    if (a.includes("update") || a.includes("edit")) return <Edit className={cls} />;
    return <Activity className={cls} />;
}

function formatAction(action: string) {
    return action
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

function formatTimeAgo(dateString: string) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
