// src/pages/coi/admin-detail.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { LoadingOverlay, QrCodeModal } from "../../components";
import { useMutationToast } from "../../hooks/useMutationToast";
import { fetchApi } from "../../lib/api";
import { COI, COIReviewPayload, COIStatus, RequirementTemplate } from "../../types";
import { useToast } from "../../ui/toast/ToastProvider";

export default function AdminCoiDetailPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const { show } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch COI detail
  const {
    data: coi,
    isLoading,
    refetch,
  } = useQuery<COI>({
    queryKey: ["coi", id],
    queryFn: () => fetchApi(`/cois/${id}`),
    enabled: !!id,
  });

  // Fetch building requirements
  const { data: requirements } = useQuery<RequirementTemplate[]>({
    queryKey: ["requirements", coi?.building.id],
    queryFn: () => fetchApi(`/buildings/${coi?.building.id}/requirements`),
    enabled: !!coi?.building.id,
  });

  const activeReq = requirements?.find((r) => r.active);

  // Review mutation
  const reviewMutation = useMutationToast(
    (payload: COIReviewPayload) =>
      fetchApi(`/cois/${id}/review`, { method: "PATCH", body: payload }),
    {
      success: {
        title: "Review Submitted",
        description: "COI status has been updated",
      },
      onSuccess: () => {
        refetch();
        setReviewNotes("");
      },
    }
  );

  const handleApprove = () => {
    reviewMutation.mutate({
      status: "APPROVED",
      notes: reviewNotes || undefined,
    });
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) {
      show({
        variant: "warning",
        title: "Notes Required",
        description: "Please provide a reason for rejection",
      });
      return;
    }
    reviewMutation.mutate({ status: "REJECTED", notes: reviewNotes });
  };

  const handleDownloadZip = async () => {
    try {
      const blob = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/cois/${id}/files.zip`,
        {
          credentials: "include",
        }
      ).then((r) => r.blob());

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coi-${id}-files.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      show({
        variant: "error",
        title: "Download failed",
        description: String(error),
      });
    }
  };

  if (isLoading) return <LoadingOverlay />;
  if (!coi) return <div className="text-center py-16">COI not found</div>;

  const isExpired =
    coi.expirationDate && new Date(coi.expirationDate) < new Date();
  const isExpiringSoon =
    coi.expirationDate &&
    new Date(coi.expirationDate) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/admin/cois" })}
          className="btn btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </button>
        {coi.files.length > 0 && (
          <button onClick={handleDownloadZip} className="btn btn-ghost">
            <Download className="h-4 w-4" />
            Download All Files
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: COI Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Certificate Details</h2>
              <StatusBadge status={coi.status} />
            </div>

            {/* Expiration Warning */}
            {isExpired && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                ⚠️ <strong>Expired:</strong> This certificate expired on{" "}
                {format(new Date(coi.expirationDate!), "MM/dd/yyyy")}
              </div>
            )}
            {!isExpired && isExpiringSoon && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                ⏰ <strong>Expiring Soon:</strong> Certificate expires on{" "}
                {format(new Date(coi.expirationDate!), "MM/dd/yyyy")}
              </div>
            )}

            <dl className="space-y-4">
              <DetailRow label="Vendor" value={coi.vendor.legalName} />
              <DetailRow
                label="Building"
                value={`${coi.building.name} (${coi.building.address})`}
              />
              <DetailRow label="Producer" value={coi.producer} />
              <DetailRow label="Insured Name" value={coi.insuredName} />
              <DetailRow
                label="Effective Date"
                value={
                  coi.effectiveDate
                    ? format(new Date(coi.effectiveDate), "MM/dd/yyyy")
                    : undefined
                }
              />
              <DetailRow
                label="Expiration Date"
                value={
                  coi.expirationDate
                    ? format(new Date(coi.expirationDate), "MM/dd/yyyy")
                    : undefined
                }
              />
            </dl>
          </div>

          {/* Coverage Card */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Coverage Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <CoverageRow
                label="General Liability"
                value={coi.generalLiabLimit}
                min={activeReq?.generalLiabMin}
              />
              <CoverageRow
                label="Auto Liability"
                value={coi.autoLiabLimit}
                min={activeReq?.autoLiabMin}
              />
              <CoverageRow
                label="Umbrella"
                value={coi.umbrellaLimit}
                min={activeReq?.umbrellaMin}
              />
              <CheckRow
                label="Workers Comp"
                checked={coi.workersComp}
                required={activeReq?.workersCompRequired}
              />
              <CheckRow
                label="Additional Insured"
                checked={coi.additionalInsured}
              />
              <CheckRow
                label="Waiver of Subrogation"
                checked={coi.waiverOfSubrogation}
              />
            </dl>
            {coi.certificateHolder && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <DetailRow
                  label="Certificate Holder"
                  value={coi.certificateHolder}
                />
              </div>
            )}
          </div>

          {/* Files Card */}
          {coi.files.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Attached Files</h3>
              <div className="space-y-2">
                {coi.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                  >
                    <FileText className="h-5 w-5 text-neutral-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.kind}</p>
                      <p className="text-xs text-neutral-500">PDF Document</p>
                    </div>
                    <Download className="h-4 w-4 text-neutral-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Review Panel */}
        <div className="space-y-6">
          {/* Review Card */}
          {coi.status === "PENDING" && (
            <div className="card p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Review Certificate</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (optional for approval, required for rejection)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="field min-h-[100px]"
                    placeholder="Add notes about this review..."
                  />
                </div>
                <div className="space-y-2">
                  <QrCodeModal
                    vendorId={coi.vendorId}
                    buildingId={coi.buildingId}
                    vendorName={coi.vendor?.legalName}
                    buildingName={coi.building?.name}
                  />
                  <button
                    onClick={handleApprove}
                    className="btn btn-primary w-full"
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn btn-ghost w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status History */}
          {coi.notes && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Review Notes</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {coi.notes}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Metadata</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Created</dt>
                <dd>{format(new Date(coi.createdAt), "MMM dd, yyyy HH:mm")}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Last Updated</dt>
                <dd>{format(new Date(coi.updatedAt), "MMM dd, yyyy HH:mm")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: COIStatus }) {
  const config = {
    PENDING: {
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    },
    APPROVED: {
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    },
    REJECTED: {
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    },
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${config[status].className}`}
    >
      {status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="mt-1 font-medium">{value || "—"}</dd>
    </div>
  );
}

function CoverageRow({
  label,
  value,
  min,
}: {
  label: string;
  value?: number;
  min?: number;
}) {
  const meets = !min || !value || value >= min;
  return (
    <div>
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className={`mt-1 font-medium ${!meets ? "text-red-600" : ""}`}>
        {value ? `$${value.toLocaleString()}` : "—"}
        {min && (
          <span className="text-xs text-neutral-500 ml-1">
            (min: ${min.toLocaleString()})
          </span>
        )}
      </dd>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  required,
}: {
  label: string;
  checked?: boolean;
  required?: boolean;
}) {
  const meets = !required || checked;
  return (
    <div>
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className={`mt-1 font-medium ${!meets ? "text-red-600" : ""}`}>
        {checked ? "✓ Yes" : "✗ No"}
        {required && (
          <span className="text-xs text-neutral-500 ml-1">(required)</span>
        )}
      </dd>
    </div>
  );
}
