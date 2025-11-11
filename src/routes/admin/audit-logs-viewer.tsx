// src/pages/admin/AuditLogsViewer.tsx
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Filter,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingOverlay } from "../../components";
import { fetchApi } from "../../lib/api";
import { AuditListResponse, AuditLogItem } from "../../types";

export default function AuditLogsViewer() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  // Fetch audit logs - endpoint: GET /audit/logs
  const { data, isLoading } = useQuery<AuditListResponse>({
    queryKey: [
      "audit-logs",
      actionFilter,
      entityFilter,
      dateFrom,
      dateTo,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity", entityFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) params.set("to", new Date(dateTo).toISOString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("sort", "desc"); // Most recent first
      return fetchApi(`/audit/logs?${params}`);
    },
  });

  const logs = data?.items || [];
  const total = data?.total || 0;
  const hasNext = data?.hasNext || false;

  // Filter logs by search term (client-side)
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (log) =>
        log.actorId.toLowerCase().includes(term) ||
        log.entityId.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  // Export logs
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity", entityFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) params.set("to", new Date(dateTo).toISOString());

      const blob = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/audit/logs/export?${params}`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      ).then((r) => r.blob());

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isLoading && page === 1) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Complete audit trail for compliance and security
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-ghost">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="This Page"
          value={logs.length}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Approvals"
          value={logs.filter((l) => l.action.includes("APPROVED")).length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Rejections"
          value={logs.filter((l) => l.action.includes("REJECTED")).length}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="field pl-10 w-full"
            />
          </div>

          {/* Action Filter */}
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Action (e.g., REVIEW.APPROVED)"
            className="field"
          />

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="field"
          >
            <option value="">All Entities</option>
            <option value="COI">COI</option>
            <option value="BUILDING">Building</option>
            <option value="VENDOR">Vendor</option>
            <option value="REQUIREMENT">Requirement</option>
            <option value="USER">User</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="field"
            placeholder="From date"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="field"
            placeholder="To date"
          />
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState hasFilters={!!actionFilter || !!entityFilter} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredLogs.map((log) => (
                    <AuditLogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-ghost btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasNext}
                className="btn btn-ghost btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: "blue" | "amber" | "green" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Audit Log Row Component
function AuditLogRow({ log }: { log: AuditLogItem }) {
  const getActionColor = (action: string): string => {
    if (action.includes("APPROVED") || action.includes("CREATE")) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    }
    if (action.includes("REJECTED") || action.includes("DELETE")) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    }
    if (action.includes("UPDATE") || action.includes("EDIT")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    }
    if (action.includes("UPLOAD") || action.includes("DOWNLOAD")) {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
    }
    return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-200";
  };

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {format(new Date(log.at), "MMM dd, yyyy HH:mm:ss")}
      </td>
      <td className="px-6 py-4">
        <div className="font-medium text-sm font-mono">{log.actorId}</div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(
            log.action
          )}`}
        >
          {log.action}
        </span>
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-sm">{log.entity}</div>
          <div className="text-xs text-neutral-500 font-mono">
            {log.entityId}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
        {log.details && Object.keys(log.details).length > 0 ? (
          <details className="cursor-pointer">
            <summary className="text-brand hover:underline">View JSON</summary>
            <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </details>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

// Empty State Component
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="card p-12 text-center">
      <AlertCircle className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {hasFilters ? "No Logs Match Filters" : "No Audit Logs"}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {hasFilters
          ? "Try adjusting your filters to see more results"
          : "Audit logs will appear here as actions are performed"}
      </p>
    </div>
  );
}
