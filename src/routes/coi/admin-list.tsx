// src/pages/coi/admin-list.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { LoadingOverlay, QrCodeModal } from "../../components";
import { useConfirm } from "../../components/ConfirmDialog";
import { useMutationToast } from "../../hooks/useMutationToast";
import { fetchApi } from "../../lib/api";
import { Building, COI, COIListItem, COIStatus } from "../../types";

export default function AdminCoiListPage() {
  const [statusFilter, setStatusFilter] = useState<COIStatus | "ALL">(
    "PENDING"
  );
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const confirm = useConfirm();

  // Fetch COIs
  const {
    data: cois = [],
    isLoading,
    refetch,
  } = useQuery<COIListItem[]>({
    queryKey: ["cois", statusFilter, buildingFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (buildingFilter) params.set("buildingId", buildingFilter);
      return fetchApi(`/cois?${params}`);
    },
  });

  // Fetch buildings for filter
  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ["buildings"],
    queryFn: () => fetchApi("/buildings"),
  });

  // Quick approve mutation
  const approveMutation = useMutationToast(
    (id: string) => fetchApi(`/cois/${id}/approve`, { method: "PATCH" }),
    {
      success: {
        title: "COI Approved",
        description: "Certificate has been approved",
      },
      onSuccess: () => refetch(),
    }
  );

  // Quick reject mutation
  const rejectMutation = useMutationToast(
    (id: string) => fetchApi(`/cois/${id}/reject`, { method: "PATCH" }),
    {
      success: {
        title: "COI Rejected",
        description: "Certificate has been rejected",
      },
      onSuccess: () => refetch(),
    }
  );

  const handleQuickApprove = async (coi: COIListItem) => {
    const ok = await confirm({
      title: "Approve Certificate?",
      description: `Approve COI for ${coi.vendor.legalName} at ${coi.building.name}?`,
      confirmText: "Approve",
      cancelText: "Cancel",
    });
    if (ok) approveMutation.mutate(coi.id);
  };

  const handleQuickReject = async (coi: COIListItem) => {
    const ok = await confirm({
      title: "Reject Certificate?",
      description: `Reject COI for ${coi.vendor.legalName}? The vendor will be notified.`,
      confirmText: "Reject",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (ok) rejectMutation.mutate(coi.id);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (buildingFilter) params.set("buildingId", buildingFilter);

      const blob = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/cois/export?${params}`,
        {
          credentials: "include",
        }
      ).then((r) => r.blob());

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cois-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isLoading) return <LoadingOverlay />;

  const statusCounts = {
    ALL: cois.length,
    PENDING: cois.filter((c) => c.status === "PENDING").length,
    APPROVED: cois.filter((c) => c.status === "APPROVED").length,
    REJECTED: cois.filter((c) => c.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Certificates of Insurance
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Review and manage vendor insurance certificates
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn btn-ghost">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link to="/admin/request" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Request COI
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-medium transition ${
              statusFilter === status
                ? "border-b-2 border-brand text-brand"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            {status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="field w-64"
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* COI Table */}
      {cois.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No COIs found</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {statusFilter === "PENDING"
              ? "No pending certificates to review"
              : "Try adjusting your filters"}
          </p>
          <Link to="/admin/request" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Request New COI
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Building
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {cois.map((coi: COIListItem) => (
                <tr
                  key={coi.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium">{coi.vendor.legalName}</div>
                    {coi.insuredName && (
                      <div className="text-sm text-neutral-500">
                        {coi.insuredName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{coi.building.name}</td>
                  <td className="px-6 py-4 text-sm">
                    {coi.expirationDate ? (
                      <span
                        className={
                          new Date(coi.expirationDate) < new Date()
                            ? "text-red-600 font-medium"
                            : new Date(coi.expirationDate) <
                              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? "text-amber-600 font-medium"
                            : ""
                        }
                      >
                        {format(new Date(coi.expirationDate), "MM/dd/yyyy")}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={coi.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <QrCodeModal
                      vendorId={coi?.vendorId}
                      buildingId={coi?.buildingId}
                      vendorName={coi.vendor?.legalName}
                      buildingName={coi.building?.name}
                    />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      to="/admin/cois/$id"
                      params={{ id: coi.id }}
                      className="btn btn-sm btn-ghost"
                    >
                      View
                    </Link>
                    {coi.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleQuickApprove(coi)}
                          className="text-sm text-green-600 hover:underline"
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleQuickReject(coi)}
                          className="text-sm text-red-600 hover:underline"
                          disabled={rejectMutation.isPending}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: COIStatus }) {
  const config = {
    PENDING: {
      icon: Clock,
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    },
    APPROVED: {
      icon: CheckCircle,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    },
    REJECTED: {
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    },
  };

  const { icon: Icon, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
