// src/routes/coi/admin-detail.tsx
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "../../components/Alert";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import OcrExtractionButton from "../../components/OcrExtractionButton";
import { useApi } from "../../hooks/useApi";
import type { COI, COIStatus } from "../../types/coi.types";

export default function AdminCoiDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch COI details
  const {
    data: coi,
    loading: isLoading,
    error,
    execute: fetchCoi,
  } = useApi<COI>(`/cois/${id}`, {
    showErrorToast: true,
  });

  // Approve COI
  const {
    loading: isApproving,
    execute: executeApprove,
  } = useApi(`/cois/${id}/approve`, {
    showSuccessToast: true,
    successMessage: "COI approved successfully",
    showErrorToast: true,
  });

  // Reject COI
  const {
    loading: isRejecting,
    execute: executeReject,
  } = useApi(`/cois/${id}/reject`, {
    showSuccessToast: true,
    successMessage: "COI rejected successfully",
    showErrorToast: true,
  });

  // Load COI on mount
  useEffect(() => {
    if (id) {
      fetchCoi();
    }
  }, [id, fetchCoi]);

  // Handle approve
  const handleApprove = async () => {
    try {
      await executeApprove({
        method: "PATCH",
        body: JSON.stringify({ notes: reviewNotes }),
      });
      // Reload COI to get updated status
      await fetchCoi();
    } catch (err) {
      // Error already handled by useApi
    }
  };

  // Handle reject
  const handleReject = async () => {
    try {
      await executeReject({
        method: "PATCH",
        body: JSON.stringify({ notes: reviewNotes }),
      });
      // Reload COI to get updated status
      await fetchCoi();
    } catch (err) {
      // Error already handled by useApi
    }
  };

  // Download all files as ZIP
  const downloadZip = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "/api";
    window.open(`${apiUrl}/cois/${id}/files.zip`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading COI details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !coi) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card variant="elevated" tone="danger" padding="xl">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">COI Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The requested Certificate of Insurance could not be found.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate({ to: "/admin/cois" })}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to COIs
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const typedCoi = coi as COI;
  const isExpired = typedCoi.expirationDate
    ? new Date(typedCoi.expirationDate) < new Date()
    : false;
  const daysUntilExpiry = typedCoi.expirationDate
    ? Math.ceil(
        (new Date(typedCoi.expirationDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isProcessing = isApproving || isRejecting;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/cois" })}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back to COIs
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Certificate of Insurance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
              ID: {typedCoi.id}
            </p>
          </div>

          <StatusBadge status={typedCoi.status} />
        </div>
      </div>

      {/* Expiration Warnings */}
      {isExpired && (
        <Alert
          variant="danger"
          title="COI Has Expired"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          This certificate is no longer valid and must be renewed.
        </Alert>
      )}

      {daysUntilExpiry !== null &&
        daysUntilExpiry > 0 &&
        daysUntilExpiry <= 30 && (
          <Alert
            variant="warning"
            title={`Expires in ${daysUntilExpiry} day${
              daysUntilExpiry !== 1 ? "s" : ""
            }`}
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            This certificate will expire soon. Please ensure renewal is in
            progress.
          </Alert>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card variant="elevated">
            <Card.Header>
              <h2 className="text-xl font-bold">Basic Information</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  icon={<User className="h-5 w-5" />}
                  label="Vendor"
                  value={typedCoi.vendor.legalName}
                  sublabel={typedCoi.vendor.contactEmail}
                />
                <InfoField
                  icon={<Building2 className="h-5 w-5" />}
                  label="Building"
                  value={typedCoi.building.name}
                  sublabel={typedCoi.building.address}
                />
                {typedCoi.insuredName && (
                  <InfoField
                    icon={<ShieldCheck className="h-5 w-5" />}
                    label="Insured Name"
                    value={typedCoi.insuredName}
                  />
                )}
                {typedCoi.producer && (
                  <InfoField
                    icon={<FileText className="h-5 w-5" />}
                    label="Producer"
                    value={typedCoi.producer}
                  />
                )}
                {typedCoi.certificateHolder && (
                  <InfoField
                    icon={<FileText className="h-5 w-5" />}
                    label="Certificate Holder"
                    value={typedCoi.certificateHolder}
                  />
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Policy Dates */}
          {(typedCoi.effectiveDate || typedCoi.expirationDate) && (
            <Card variant="elevated">
              <Card.Header>
                <h2 className="text-xl font-bold">Policy Dates</h2>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {typedCoi.effectiveDate && (
                    <InfoField
                      icon={<Calendar className="h-5 w-5" />}
                      label="Effective Date"
                      value={new Date(
                        typedCoi.effectiveDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    />
                  )}
                  {typedCoi.expirationDate && (
                    <InfoField
                      icon={<Calendar className="h-5 w-5" />}
                      label="Expiration Date"
                      value={new Date(
                        typedCoi.expirationDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      isWarning={isExpired}
                    />
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Coverage Limits */}
          {(typedCoi.generalLiabLimit ||
            typedCoi.autoLiabLimit ||
            typedCoi.umbrellaLimit) && (
            <Card variant="elevated">
              <Card.Header>
                <h2 className="text-xl font-bold">Coverage Limits</h2>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {typedCoi.generalLiabLimit && (
                    <InfoField
                      icon={<DollarSign className="h-5 w-5" />}
                      label="General Liability"
                      value={`$${typedCoi.generalLiabLimit.toLocaleString()}`}
                    />
                  )}
                  {typedCoi.autoLiabLimit && (
                    <InfoField
                      icon={<DollarSign className="h-5 w-5" />}
                      label="Auto Liability"
                      value={`$${typedCoi.autoLiabLimit.toLocaleString()}`}
                    />
                  )}
                  {typedCoi.umbrellaLimit && (
                    <InfoField
                      icon={<DollarSign className="h-5 w-5" />}
                      label="Umbrella"
                      value={`$${typedCoi.umbrellaLimit.toLocaleString()}`}
                    />
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Coverage Features */}
          <Card variant="elevated">
            <Card.Header>
              <h2 className="text-xl font-bold">Coverage Features</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureBadge
                  label="Workers Compensation"
                  active={typedCoi.workersComp}
                />
                <FeatureBadge
                  label="Additional Insured"
                  active={typedCoi.additionalInsured}
                />
                <FeatureBadge
                  label="Waiver of Subrogation"
                  active={typedCoi.waiverOfSubrogation}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Attached Files */}
          <Card variant="elevated">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Attached Files</h2>
                {typedCoi.files.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadZip}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Download All (ZIP)
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {typedCoi.files.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No files attached
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {typedCoi.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {file.kind}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            PDF Document
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Review Notes */}
          {typedCoi.notes && (
            <Card variant="elevated" tone="info">
              <Card.Header>
                <h2 className="text-xl font-bold">Review Notes</h2>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {typedCoi.notes}
                </p>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Actions Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {typedCoi.status === "PENDING" && (
            <Card variant="elevated" tone="info">
              <Card.Header>
                <h2 className="text-lg font-bold">Review Actions</h2>
              </Card.Header>
              <Card.Body className="space-y-6">
                {/* OCR Extraction Button */}
                <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Extract data automatically from PDF
                  </p>
                  <OcrExtractionButton coiId={typedCoi.id} />
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="success"
                    size="lg"
                    fullWidth
                    onClick={handleApprove}
                    disabled={isProcessing}
                    loading={isApproving}
                    loadingText="Approving..."
                    leftIcon={<CheckCircle className="h-5 w-5" />}
                  >
                    Approve COI
                  </Button>

                  <Button
                    variant="danger"
                    size="lg"
                    fullWidth
                    onClick={handleReject}
                    disabled={isProcessing}
                    loading={isRejecting}
                    loadingText="Rejecting..."
                    leftIcon={<XCircle className="h-5 w-5" />}
                  >
                    Reject COI
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Metadata */}
          <Card variant="bordered">
            <Card.Header>
              <h2 className="text-lg font-bold">Metadata</h2>
            </Card.Header>
            <Card.Body className="space-y-4">
              <MetadataField
                label="Created"
                value={new Date(typedCoi.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <MetadataField
                label="Last Updated"
                value={new Date(typedCoi.updatedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <MetadataField label="COI ID" value={typedCoi.id} mono />
              </div>
              <MetadataField label="Vendor ID" value={typedCoi.vendorId} mono />
              <MetadataField
                label="Building ID"
                value={typedCoi.buildingId}
                mono
              />
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: COIStatus }) {
  const config: Record<
    COIStatus,
    { variant: "warning" | "success" | "danger"; label: string }
  > = {
    PENDING: { variant: "warning", label: "Pending Review" },
    APPROVED: { variant: "success", label: "Approved" },
    REJECTED: { variant: "danger", label: "Rejected" },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} size="lg" dot>
      {label}
    </Badge>
  );
}

function InfoField({
  icon,
  label,
  value,
  sublabel,
  isWarning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  isWarning?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
        <div className="text-blue-600 dark:text-blue-400">{icon}</div>
        {label}
      </div>
      <p
        className={`text-base font-semibold ${
          isWarning
            ? "text-red-600 dark:text-red-400"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{sublabel}</p>
      )}
    </div>
  );
}

function FeatureBadge({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
        active
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
      }`}
    >
      {active ? (
        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="h-6 w-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      )}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function MetadataField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <p
        className={`text-sm text-gray-900 dark:text-gray-100 ${
          mono ? "font-mono text-xs break-all" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
