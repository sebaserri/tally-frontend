// src/routes/cois.$id.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { useState } from "react";
import OcrExtractionButton from "../components/OcrExtractionButton";
import { fetchApi } from "../lib/api";
import type { COI, COIStatus } from "../types/coi.types";

export const Route = createFileRoute("/cois/$id")({
  component: COIDetails,
});

function COIDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch COI details
  const {
    data: coi,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["coi", id],
    queryFn: () => fetchApi(`/cois/${id}`),
    enabled: !!id,
  });

  // Approve COI
  const approveMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/cois/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ notes: reviewNotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coi", id] });
      queryClient.invalidateQueries({ queryKey: ["cois"] });
      console.log("✓ COI approved");
    },
  });

  // Reject COI
  const rejectMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/cois/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ notes: reviewNotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coi", id] });
      queryClient.invalidateQueries({ queryKey: ["cois"] });
      console.log("✓ COI rejected");
    },
  });

  // Download all files as ZIP
  const downloadZip = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/cois/${id}/files.zip`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error || !coi) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">COI Not Found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            The requested Certificate of Insurance could not be found.
          </p>
          <button
            onClick={() => navigate({ to: "/cois" })}
            className="btn btn-primary"
          >
            Back to COIs
          </button>
        </div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate({ to: "/cois" })}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to COIs
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Certificate of Insurance
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              COI ID: {typedCoi.id}
            </p>
          </div>

          {/* Status Badge */}
          <StatusBadge status={typedCoi.status} />
        </div>
      </div>

      {/* Expiration Warning */}
      {isExpired && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-900 dark:text-red-100">
              This COI has expired
            </span>
          </div>
        </div>
      )}

      {daysUntilExpiry !== null &&
        daysUntilExpiry > 0 &&
        daysUntilExpiry <= 30 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                Expires in {daysUntilExpiry} day
                {daysUntilExpiry !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Basic Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  icon={<User className="h-4 w-4" />}
                  label="Vendor"
                  value={typedCoi.vendor.legalName}
                  sublabel={typedCoi.vendor.contactEmail}
                />
                <InfoField
                  icon={<Building2 className="h-4 w-4" />}
                  label="Building"
                  value={typedCoi.building.name}
                  sublabel={typedCoi.building.address}
                />
                {typedCoi.insuredName && (
                  <InfoField
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Insured Name"
                    value={typedCoi.insuredName}
                  />
                )}
                {typedCoi.producer && (
                  <InfoField
                    icon={<FileText className="h-4 w-4" />}
                    label="Producer"
                    value={typedCoi.producer}
                  />
                )}
                {typedCoi.certificateHolder && (
                  <InfoField
                    icon={<FileText className="h-4 w-4" />}
                    label="Certificate Holder"
                    value={typedCoi.certificateHolder}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Policy Dates */}
          {(typedCoi.effectiveDate || typedCoi.expirationDate) && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Policy Dates</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typedCoi.effectiveDate && (
                    <InfoField
                      icon={<Calendar className="h-4 w-4" />}
                      label="Effective Date"
                      value={new Date(
                        typedCoi.effectiveDate
                      ).toLocaleDateString()}
                    />
                  )}
                  {typedCoi.expirationDate && (
                    <InfoField
                      icon={<Calendar className="h-4 w-4" />}
                      label="Expiration Date"
                      value={new Date(
                        typedCoi.expirationDate
                      ).toLocaleDateString()}
                      isWarning={isExpired}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coverage Limits */}
          {(typedCoi.generalLiabLimit ||
            typedCoi.autoLiabLimit ||
            typedCoi.umbrellaLimit) && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Coverage Limits</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {typedCoi.generalLiabLimit && (
                    <InfoField
                      icon={<DollarSign className="h-4 w-4" />}
                      label="General Liability"
                      value={`$${typedCoi.generalLiabLimit.toLocaleString()}`}
                    />
                  )}
                  {typedCoi.autoLiabLimit && (
                    <InfoField
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Auto Liability"
                      value={`$${typedCoi.autoLiabLimit.toLocaleString()}`}
                    />
                  )}
                  {typedCoi.umbrellaLimit && (
                    <InfoField
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Umbrella"
                      value={`$${typedCoi.umbrellaLimit.toLocaleString()}`}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coverage Features */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Coverage Features</h2>
            </div>
            <div className="card-body">
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
            </div>
          </div>

          {/* Attached Files */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Attached Files</h2>
                {typedCoi.files.length > 0 && (
                  <button
                    onClick={downloadZip}
                    className="btn btn-ghost btn-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download All (ZIP)
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {typedCoi.files.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">
                  No files attached
                </p>
              ) : (
                <div className="space-y-2">
                  {typedCoi.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-brand" />
                        <div>
                          <p className="font-medium">{file.kind}</p>
                          <p className="text-xs text-neutral-500">
                            PDF Document
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-neutral-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review Notes */}
          {typedCoi.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Review Notes</h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                  {typedCoi.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {typedCoi.status === "PENDING" && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Review Actions</h2>
              </div>
              <div className="card-body space-y-4">
                {/* OCR Extraction Button */}
                <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Extract data automatically from PDF
                  </p>
                  <OcrExtractionButton coiId={typedCoi.id} />
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={
                      approveMutation.isPending || rejectMutation.isPending
                    }
                    className="btn btn-success w-full"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approveMutation.isPending ? "Approving..." : "Approve COI"}
                  </button>

                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={
                      approveMutation.isPending || rejectMutation.isPending
                    }
                    className="btn btn-danger w-full"
                  >
                    <XCircle className="h-4 w-4" />
                    {rejectMutation.isPending ? "Rejecting..." : "Reject COI"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Metadata</h2>
            </div>
            <div className="card-body space-y-3">
              <MetadataField
                label="Created"
                value={new Date(typedCoi.createdAt).toLocaleString()}
              />
              <MetadataField
                label="Last Updated"
                value={new Date(typedCoi.updatedAt).toLocaleString()}
              />
              <MetadataField label="COI ID" value={typedCoi.id} mono />
              <MetadataField label="Vendor ID" value={typedCoi.vendorId} mono />
              <MetadataField
                label="Building ID"
                value={typedCoi.buildingId}
                mono
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: COIStatus }) {
  const styles = {
    PENDING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    APPROVED:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}
    >
      {status}
    </span>
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
    <div>
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-1">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium ${isWarning ? "text-red-600" : ""}`}>
        {value}
      </p>
      {sublabel && <p className="text-xs text-neutral-500 mt-1">{sublabel}</p>}
    </div>
  );
}

function FeatureBadge({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
      {active ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-neutral-400" />
      )}
      <span className="text-sm font-medium">{label}</span>
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
      <label className="block text-xs font-medium text-neutral-500 mb-1">
        {label}
      </label>
      <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
