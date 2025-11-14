import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  Check,
  CheckCircle,
  Download,
  FileText,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoadingOverlay, OcrExtractionButton } from "../../components";
import { useApi } from "../../hooks/useApi";
import { API_BASE } from "../../lib/api";
import { COI, COIStatus } from "../../types";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "—";

export default function COIDetails() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Fetch COI
  const {
    data: coi,
    loading: isLoading,
    error,
    execute: fetchCoi,
  } = useApi<COI>(`/cois/${id}`, {
    showErrorToast: true,
  });

  // Review COI (approve/reject)
  const { loading: isReviewing, execute: executeReview } = useApi(
    `/cois/${id}/review`,
    {
      showSuccessToast: true,
      showErrorToast: true,
    }
  );

  // Load COI on mount
  useEffect(() => {
    if (id) {
      fetchCoi();
    }
  }, [id, fetchCoi]);

  const handleDownloadZip = async () => {
    if (!id) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const response = await fetch(`${API_BASE}/cois/${id}/files.zip`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Unable to download files");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coi-${id}-files.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await executeReview({
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      // Reload COI to show updated status
      await fetchCoi();
    } catch (err) {
      // Error already handled by useApi
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) return;

    try {
      await executeReview({
        method: "PATCH",
        body: JSON.stringify({
          status: "REJECTED",
          notes: rejectNotes.trim(),
        }),
      });
      // Reload COI and close modal
      await fetchCoi();
      setShowRejectModal(false);
      setRejectNotes("");
    } catch (err) {
      // Error already handled by useApi
    }
  };

  const coverage = useMemo(
    () => [
      { label: "General Liability", value: coi?.generalLiabLimit },
      { label: "Auto Liability", value: coi?.autoLiabLimit },
      { label: "Umbrella", value: coi?.umbrellaLimit },
    ],
    [coi?.autoLiabLimit, coi?.generalLiabLimit, coi?.umbrellaLimit]
  );

  if (!id) {
    return (
      <div className="mx-auto max-w-xl text-center py-16">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-semibold">Missing COI identifier</p>
        <button
          className="btn btn-primary mt-6"
          onClick={() => navigate({ to: "/admin/cois" })}
        >
          Go back
        </button>
      </div>
    );
  }

  if (isLoading) return <LoadingOverlay />;

  if (error) {
    return (
      <div className="mx-auto max-w-xl text-center py-16">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-semibold">Unable to load COI</p>
        <p className="text-sm text-neutral-500 mt-2">{error.message}</p>
        <button
          className="btn btn-primary mt-6"
          onClick={() => navigate({ to: "/admin/cois" })}
        >
          Back to list
        </button>
      </div>
    );
  }

  if (!coi) {
    return (
      <div className="mx-auto max-w-xl text-center py-16">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-semibold">COI not found</p>
        <button
          className="btn btn-primary mt-6"
          onClick={() => navigate({ to: "/admin/cois" })}
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/admin/cois" })}
          className="btn btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to COIs
        </button>
        <StatusBadge status={coi.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Certificate Information
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={<User className="h-4 w-4 text-brand" />}
                  label="Vendor"
                  value={coi.vendor.legalName}
                  description={coi.vendor.contactEmail}
                />
                <DetailItem
                  icon={<Building className="h-4 w-4 text-brand" />}
                  label="Building"
                  value={coi.building.name}
                  description={coi.building.address}
                />
                {coi.insuredName && (
                  <DetailItem label="Insured" value={coi.insuredName} />
                )}
                {coi.policyNumber && (
                  <DetailItem label="Policy Number" value={coi.policyNumber} />
                )}
                {coi.producer && (
                  <DetailItem label="Producer" value={coi.producer} />
                )}
                {coi.insurer && (
                  <DetailItem label="Insurer" value={coi.insurer} />
                )}
                <DetailItem
                  icon={<Calendar className="h-4 w-4 text-brand" />}
                  label="Effective Date"
                  value={formatDate(coi.effectiveDate)}
                />
                <DetailItem
                  icon={<Calendar className="h-4 w-4 text-brand" />}
                  label="Expiration Date"
                  value={formatDate(coi.expirationDate)}
                />
              </dl>
            </div>
            {coi.certificateHolder && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-500">Certificate Holder</p>
                <p className="font-medium">{coi.certificateHolder}</p>
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h3 className="text-xl font-semibold">Coverage Details</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {coverage.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
                >
                  <p className="text-sm text-neutral-500">{item.label}</p>
                  <p className="text-lg font-semibold">
                    {typeof item.value === "number"
                      ? currencyFormatter.format(item.value)
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxField label="Workers Comp" checked={coi.workersComp} />
              <CheckboxField
                label="Additional Insured"
                checked={coi.additionalInsured}
              />
              <CheckboxField
                label="Waiver of Subrogation"
                checked={coi.waiverOfSubrogation}
              />
            </div>
          </div>

          {coi.files.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-xl font-semibold">
                    Files ({coi.files.length})
                  </h3>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleDownloadZip}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Preparing..." : "Download All"}
                </button>
              </div>
              {downloadError && (
                <p className="text-xs text-red-500 mb-2">{downloadError}</p>
              )}
              <div className="space-y-2">
                {coi.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {file.kind || "Attachment"}
                        </p>
                        <p className="text-xs text-neutral-500">PDF</p>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-neutral-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {coi.notes && (
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2">Review Notes</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                {coi.notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {coi.status === "PENDING" && (
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold">AI Assistant</h3>
              <p className="text-sm text-neutral-500">
                Use OCR to pre-fill certificate data from uploaded files.
              </p>
              <OcrExtractionButton
                coiId={coi.id}
                onSuccess={() => fetchCoi()}
              />
            </div>
          )}

          {coi.status === "PENDING" && (
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Review Actions</h3>
              <button
                className="btn btn-success w-full"
                onClick={handleApprove}
                disabled={isReviewing}
              >
                <CheckCircle className="h-4 w-4" />
                {isReviewing ? "Processing..." : "Approve"}
              </button>
              <button
                className="btn btn-error w-full"
                onClick={() => setShowRejectModal(true)}
                disabled={isReviewing}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}

          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Metadata</h3>
            <dl className="space-y-2 text-sm">
              <DetailRow
                label="Created"
                value={new Date(coi.createdAt).toLocaleString()}
              />
              <DetailRow
                label="Updated"
                value={new Date(coi.updatedAt).toLocaleString()}
              />
            </dl>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-xl">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold">Reject COI</h3>
              <p className="text-sm text-neutral-500 mt-2">
                Provide a reason for rejection. This will be shared with the
                vendor.
              </p>
            </div>
            <div className="p-6">
              <textarea
                className="textarea textarea-bordered w-full min-h-[140px]"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain why the certificate is being rejected"
              />
            </div>
            <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNotes("");
                }}
                disabled={isReviewing}
              >
                Cancel
              </button>
              <button
                className="btn btn-error flex-1"
                onClick={handleReject}
                disabled={!rejectNotes.trim() || isReviewing}
              >
                {isReviewing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: COIStatus }) {
  const config: Record<
    COIStatus,
    { label: string; className: string; icon: JSX.Element }
  > = {
    PENDING: {
      label: "Pending Review",
      className: "text-amber-700 bg-amber-100",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    APPROVED: {
      label: "Approved",
      className: "text-green-700 bg-green-100",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    REJECTED: {
      label: "Rejected",
      className: "text-red-700 bg-red-100",
      icon: <XCircle className="h-4 w-4" />,
    },
  };
  const cfg = config[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function DetailItem({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description?: string;
  icon?: JSX.Element;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className="font-semibold mt-1">{value}</p>
      {description && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
}: {
  label: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
          checked ? "border-brand bg-brand text-white" : "border-neutral-300"
        }`}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
