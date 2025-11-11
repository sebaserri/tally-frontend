// src/pages/coi/public-submit.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchApi } from "../../lib/api";
import { useToast } from "../../ui/toast/ToastProvider";

// Validation schema
const coiSchema = z.object({
  producer: z.string().min(1, "Producer is required"),
  insuredName: z.string().min(1, "Insured name is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  generalLiabLimit: z.number().min(0).optional(),
  autoLiabLimit: z.number().min(0).optional(),
  umbrellaLimit: z.number().min(0).optional(),
  workersComp: z.boolean(),
  additionalInsured: z.boolean(),
  waiverOfSubrogation: z.boolean(),
  certificateHolder: z.string().optional(),
});

type CoiFormData = z.infer<typeof coiSchema>;

interface RequestMeta {
  vendor: { id: string; legalName: string };
  building: { id: string; name: string; address: string };
  requirements?: {
    generalLiabMin?: number;
    autoLiabMin?: number;
    umbrellaMin?: number;
    workersCompRequired: boolean;
    additionalInsuredText?: string;
    certificateHolderText: string;
  };
  expiresAt: string;
}

export default function PublicSubmitPage() {
  const { token } = useParams({ strict: false }) as { token?: string };
  const navigate = useNavigate();
  const { show } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch request meta
  const { data: meta, isLoading } = useQuery<RequestMeta>({
    queryKey: ["coi-request", token],
    queryFn: () => fetchApi(`/coi/requests/${token}`),
    enabled: !!token,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CoiFormData>({
    resolver: zodResolver(coiSchema),
    defaultValues: {
      workersComp: false,
      additionalInsured: false,
      waiverOfSubrogation: false,
      certificateHolder: meta?.requirements?.certificateHolderText || "",
    },
  });

  // Handle file upload + submission
  const onSubmit = async (data: CoiFormData) => {
    if (!token || !selectedFile) {
      show({ variant: "error", title: "Please upload a PDF certificate" });
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Get presigned URL
      const presignData = await fetchApi<{
        url: string;
        fields: Record<string, string>;
      }>(`/coi/requests/${token}/presign`, { method: "GET" });

      // Step 2: Upload to S3/MinIO
      const formData = new FormData();
      Object.entries(presignData.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", selectedFile);

      await fetch(presignData.url, {
        method: "POST",
        body: formData,
      });

      const fileUrl = `${presignData.url}/${presignData.fields.key}`;

      // Step 3: Submit COI
      await fetchApi(`/coi/requests/${token}/submit`, {
        method: "POST",
        body: {
          ...data,
          files: [{ url: fileUrl, kind: "CERTIFICATE" }],
        },
      });

      show({
        variant: "success",
        title: "Certificate submitted!",
        description:
          "Your insurance certificate has been submitted for review.",
      });

      setTimeout(() => navigate({ to: "/" }), 2000);
    } catch (error: any) {
      show({
        variant: "error",
        title: "Submission failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Invalid or expired link
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Please contact your building manager for a new submission link.
        </p>
      </div>
    );
  }

  const { vendor, building, requirements } = meta;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Submit Insurance Certificate
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          For <strong>{vendor.legalName}</strong> at{" "}
          <strong>{building.name}</strong>
        </p>
      </div>

      {/* Requirements Card */}
      {requirements && (
        <div className="card p-6 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800">
          <h3 className="font-semibold text-sky-900 dark:text-sky-100 mb-3">
            Required Coverage:
          </h3>
          <ul className="space-y-2 text-sm text-sky-800 dark:text-sky-200">
            {requirements.generalLiabMin && (
              <li>
                • General Liability: $
                {requirements.generalLiabMin.toLocaleString()} minimum
              </li>
            )}
            {requirements.autoLiabMin && (
              <li>
                • Auto Liability: ${requirements.autoLiabMin.toLocaleString()}{" "}
                minimum
              </li>
            )}
            {requirements.umbrellaMin && (
              <li>
                • Umbrella: ${requirements.umbrellaMin.toLocaleString()} minimum
              </li>
            )}
            {requirements.workersCompRequired && (
              <li>• Workers Compensation: Required</li>
            )}
          </ul>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
        {/* Producer */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Insurance Producer/Broker
          </label>
          <input
            {...register("producer")}
            className="field"
            placeholder="e.g., State Farm Insurance"
          />
          {errors.producer && (
            <p className="text-sm text-red-600 mt-1">
              {errors.producer.message}
            </p>
          )}
        </div>

        {/* Insured Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Insured Name</label>
          <input
            {...register("insuredName")}
            className="field"
            placeholder="Legal name of insured entity"
          />
          {errors.insuredName && (
            <p className="text-sm text-red-600 mt-1">
              {errors.insuredName.message}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Effective Date
            </label>
            <input
              type="date"
              {...register("effectiveDate")}
              className="field"
            />
            {errors.effectiveDate && (
              <p className="text-sm text-red-600 mt-1">
                {errors.effectiveDate.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Expiration Date
            </label>
            <input
              type="date"
              {...register("expirationDate")}
              className="field"
            />
            {errors.expirationDate && (
              <p className="text-sm text-red-600 mt-1">
                {errors.expirationDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Coverage Limits */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              General Liability
            </label>
            <input
              type="number"
              {...register("generalLiabLimit", { valueAsNumber: true })}
              className="field"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Auto Liability
            </label>
            <input
              type="number"
              {...register("autoLiabLimit", { valueAsNumber: true })}
              className="field"
              placeholder="500000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Umbrella</label>
            <input
              type="number"
              {...register("umbrellaLimit", { valueAsNumber: true })}
              className="field"
              placeholder="1000000"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("workersComp")}
              className="rounded"
            />
            <span className="text-sm">Workers Compensation included</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("additionalInsured")}
              className="rounded"
            />
            <span className="text-sm">Additional Insured as required</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("waiverOfSubrogation")}
              className="rounded"
            />
            <span className="text-sm">Waiver of Subrogation</span>
          </label>
        </div>

        {/* Certificate Holder */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Certificate Holder
          </label>
          <input
            {...register("certificateHolder")}
            className="field"
            placeholder="Building/Entity name"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Certificate (PDF)
          </label>
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-brand transition">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedFile ? selectedFile.name : "Click to upload PDF"}
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting || !selectedFile}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Certificate"
          )}
        </button>
      </form>
    </div>
  );
}
