// src/routes/coi/admin-list.tsx
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Input, Select } from "../../components";
import { useApi } from "../../hooks/useApi";
import type { COIListItem } from "../../types/coi.types";

export default function AdminCoiListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch COIs using useApi
  const {
    data: cois,
    loading: isLoading,
    error,
    execute,
  } = useApi<COIListItem[]>("/cois", {
    showErrorToast: true,
  });

  // Load COIs on mount
  useEffect(() => {
    execute();
  }, [execute]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading certificates...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert
          variant="danger"
          title="Error Loading COIs"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          {error.message || "Failed to load certificates. Please try again."}
        </Alert>
      </div>
    );
  }

  const coiList = (cois as any)?.data || cois || [];

  // Filter COIs based on search and status
  const filteredCois = coiList.filter((coi: COIListItem) => {
    const matchesSearch =
      !searchQuery ||
      coi.vendor.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coi.building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coi.insuredName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || coi.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    pending: coiList.filter((c: COIListItem) => c.status === "PENDING").length,
    approved: coiList.filter((c: COIListItem) => c.status === "APPROVED")
      .length,
    rejected: coiList.filter((c: COIListItem) => c.status === "REJECTED")
      .length,
    total: coiList.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
        {/* Left: Header Section */}
        <div className="space-y-4 flex-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Insurance Management
            </span>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-br from-gray-900 via-gray-700 to-gray-800 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Certificates of Insurance
              </span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 via-blue-500 to-transparent rounded-full"></div>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-2xl">
            Review, approve, and track vendor insurance compliance with
            confidence
          </p>
        </div>

        {/* Right: CTA Button */}
        <div className="sm:pt-1">
          <Link to="/admin/request">
            <button className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-400 dark:hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1 border border-blue-400/20">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
              <span className="text-base">Request COI</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          label="Total COIs"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Pending Review"
          value={stats.pending}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6" />}
          label="Approved"
          value={stats.approved}
          color="green"
        />
        <StatCard
          icon={<XCircle className="h-6 w-6" />}
          label="Rejected"
          value={stats.rejected}
          color="red"
        />
      </div>

      {/* Filters */}
      <Card variant="elevated">
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search by vendor, building, or insured..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="sm:w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="All Statuses"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          </div>
          {(searchQuery || statusFilter) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredCois.length} of {stats.total} certificates
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* COI List */}
      {filteredCois.length === 0 ? (
        <Card variant="elevated">
          <Card.Body>
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {searchQuery || statusFilter ? "No COIs Found" : "No COIs Yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by requesting a COI from a vendor."}
              </p>
              {!searchQuery && !statusFilter && (
                <Link to="/admin/request">
                  <Button
                    variant="primary"
                    leftIcon={<Plus className="h-5 w-5" />}
                  >
                    Request First COI
                  </Button>
                </Link>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card variant="elevated" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Insured
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Coverage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredCois.map((coi: COIListItem) => (
                  <COIRow key={coi.id} coi={coi} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function COIRow({ coi }: { coi: COIListItem }) {
  const isExpired = coi.expirationDate
    ? new Date(coi.expirationDate) < new Date()
    : false;
  const daysUntilExpiry = coi.expirationDate
    ? Math.ceil(
        (new Date(coi.expirationDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
      {/* Vendor */}
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {coi.vendor.legalName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {coi.vendorId.slice(0, 8)}...
            </div>
          </div>
        </div>
      </td>

      {/* Building */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {coi.building.name}
        </div>
      </td>

      {/* Insured */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {coi.insuredName || <span className="text-gray-400">—</span>}
        </div>
      </td>

      {/* Coverage */}
      <td className="px-6 py-4">
        <div className="space-y-1.5">
          {coi.generalLiabLimit && (
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                GL
              </Badge>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${(coi.generalLiabLimit / 1000000).toFixed(1)}M
              </span>
            </div>
          )}
          {coi.autoLiabLimit && (
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                Auto
              </Badge>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ${(coi.autoLiabLimit / 1000000).toFixed(1)}M
              </span>
            </div>
          )}
          {coi.workersComp && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Workers Comp
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Expiration */}
      <td className="px-6 py-4">
        <div className="flex items-start gap-2">
          <Calendar
            className={`h-4 w-4 mt-0.5 ${
              isExpired
                ? "text-red-500"
                : isExpiringSoon
                ? "text-amber-500"
                : "text-gray-400"
            }`}
          />
          <div>
            {coi.expirationDate ? (
              <>
                <div
                  className={`text-sm font-semibold ${
                    isExpired
                      ? "text-red-600 dark:text-red-400"
                      : isExpiringSoon
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {new Date(coi.expirationDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                {isExpired ? (
                  <Badge variant="danger" size="sm" className="mt-1">
                    Expired
                  </Badge>
                ) : isExpiringSoon ? (
                  <Badge variant="warning" size="sm" className="mt-1">
                    {daysUntilExpiry}d left
                  </Badge>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={coi.status} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <Link
          to="/admin/cois/$id"
          params={{ id: coi.id }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<FileText className="h-4 w-4" />}
          >
            View Details
          </Button>
        </Link>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: {
      variant: "warning" as const,
      label: "Pending",
      icon: Clock,
    },
    APPROVED: {
      variant: "success" as const,
      label: "Approved",
      icon: CheckCircle,
    },
    REJECTED: {
      variant: "danger" as const,
      label: "Rejected",
      icon: XCircle,
    },
  };

  const statusConfig = config[status as keyof typeof config] || config.PENDING;
  const Icon = statusConfig.icon;

  return (
    <Badge
      variant={statusConfig.variant}
      size="md"
      icon={<Icon className="h-3.5 w-3.5" />}
    >
      {statusConfig.label}
    </Badge>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "yellow" | "green" | "red";
}) {
  const colorConfig = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-100",
      icon: "text-blue-600 dark:text-blue-400",
    },
    yellow: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-900 dark:text-amber-100",
      icon: "text-amber-600 dark:text-amber-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-900 dark:text-green-100",
      icon: "text-green-600 dark:text-green-400",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-900 dark:text-red-100",
      icon: "text-red-600 dark:text-red-400",
    },
  };

  const colors = colorConfig[color];

  return (
    <Card
      variant="bordered"
      padding="none"
      className={`${colors.bg} ${colors.border} border-2`}
    >
      <Card.Body className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${colors.text} mb-1`}>
              {label}
            </p>
            <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colors.bg} ${colors.icon}`}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
