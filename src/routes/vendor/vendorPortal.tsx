// src/pages/vendor/VendorPortal.tsx
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  XCircle,
} from "lucide-react";
import { LoadingOverlay } from "../../components";
import { fetchApi } from "../../lib/api";
import { COIListItem, COIStatus } from "../../types";

export default function VendorPortal() {
  // Fetch vendor's COIs - endpoint: GET /cois (filtered by vendor user)
  const { data: cois = [], isLoading } = useQuery<COIListItem[]>({
    queryKey: ["vendor-cois"],
    queryFn: () => fetchApi("/cois"),
  });

  if (isLoading) return <LoadingOverlay />;

  // Group COIs by status for better overview
  const pendingCois = cois.filter((c) => c.status === "PENDING");
  const approvedCois = cois.filter((c) => c.status === "APPROVED");
  const rejectedCois = cois.filter((c) => c.status === "REJECTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Certificates of Insurance
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            View and manage your insurance certificates
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Upload New COI
        </button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Pending Review"
          count={pendingCois.length}
          icon={Clock}
          color="amber"
        />
        <StatusCard
          title="Approved"
          count={approvedCois.length}
          icon={CheckCircle}
          color="green"
        />
        <StatusCard
          title="Rejected"
          count={rejectedCois.length}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* COI List */}
      {cois.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {/* Pending COIs */}
          {pendingCois.length > 0 && (
            <Section title="Pending Review" count={pendingCois.length}>
              {pendingCois.map((coi) => (
                <COICard key={coi.id} coi={coi} />
              ))}
            </Section>
          )}

          {/* Approved COIs */}
          {approvedCois.length > 0 && (
            <Section title="Approved" count={approvedCois.length}>
              {approvedCois.map((coi) => (
                <COICard key={coi.id} coi={coi} />
              ))}
            </Section>
          )}

          {/* Rejected COIs */}
          {rejectedCois.length > 0 && (
            <Section title="Rejected" count={rejectedCois.length}>
              {rejectedCois.map((coi) => (
                <COICard key={coi.id} coi={coi} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

// Status Card Component
function StatusCard({
  title,
  count,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  icon: any;
  color: "amber" | "green" | "red";
}) {
  const colorClasses = {
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
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{count}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Section Component
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">
          {title} ({count})
        </h2>
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {children}
      </div>
    </div>
  );
}

// COI Card Component
function COICard({ coi }: { coi: COIListItem }) {
  const isExpiringSoon =
    coi.expirationDate &&
    new Date(coi.expirationDate) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const isExpired =
    coi.expirationDate && new Date(coi.expirationDate) < new Date();

  return (
    <div className="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{coi.building.name}</h3>
            <StatusBadge status={coi.status} />
          </div>

          <div className="mt-2 space-y-1">
            {coi.insuredName && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Insured: {coi.insuredName}
              </p>
            )}

            {coi.expirationDate && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Expires:
                </span>
                <span
                  className={`font-medium ${
                    isExpired
                      ? "text-red-600"
                      : isExpiringSoon
                      ? "text-amber-600"
                      : "text-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {format(new Date(coi.expirationDate), "MMMM dd, yyyy")}
                </span>
                {(isExpired || isExpiringSoon) && (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
              </div>
            )}

            {coi.uploadedAt && (
              <p className="text-xs text-neutral-500">
                Uploaded on {format(new Date(coi.uploadedAt), "MMM dd, yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-sm btn-ghost">View Details</button>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
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

// Empty State Component
function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <FileText className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        You haven't uploaded any certificates of insurance yet. Get started by
        uploading your first COI.
      </p>
      <button className="btn btn-primary">
        <Plus className="h-4 w-4" />
        Upload Your First COI
      </button>
    </div>
  );
}
