import { auth } from "@/auth";
import { getGlobalMetrics, getAILogs } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Folder, BookOpen, Database, Activity, Clock, ServerCrash, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Fetch data
  const metrics = await getGlobalMetrics();
  const { logs, aggregates } = await getAILogs(50);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all">
            &larr; Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Global Platform Metrics & AI Observability</p>
        </div>
      </div>

      {/* Platform KPIs */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Platform Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spaces</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSpaces}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Materials Uploaded</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalMaterials}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Observability KPIs */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">AI Observability</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total AI Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.totalCalls}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className={`h-4 w-4 ${aggregates.successRate < 90 ? 'text-red-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.successRate}%</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(aggregates.totalTokens / 1000).toFixed(1)}k</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregates.avgLatency}ms</div>
            </CardContent>
          </Card>
        </div>

        {/* AI Logs Table */}
        <Card className="rounded-2xl shadow-sm border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle>Recent AI Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Tokens (P/C)</th>
                      <th className="px-4 py-3">Latency</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {log.user.name || log.user.email}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.modelUsed}
                        </td>
                        <td className="px-4 py-3">
                          {log.promptTokens || 0} / {log.compTokens || 0}
                        </td>
                        <td className="px-4 py-3">
                          {log.latencyMs ? `${log.latencyMs}ms` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {log.isSuccess ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive" title={log.errorMessage || "Unknown error"}>
                              Failed
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No AI logs recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
