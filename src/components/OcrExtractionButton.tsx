// src/components/OcrExtractionButton.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, FileSearch, Loader2 } from "lucide-react";
import { useState } from "react";
import { fetchApi } from "../lib/api";
import type {
  ApplyOcrPayload,
  ExtractedField,
  OcrExtractionResult,
} from "../types/ocr.types";

interface OcrExtractionButtonProps {
  coiId: string;
  onSuccess?: (data: OcrExtractionResult) => void;
}

export default function OcrExtractionButton({
  coiId,
  onSuccess,
}: OcrExtractionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<OcrExtractionResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Extract OCR data - ENDPOINT CORREGIDO: POST /extract/coi/:id
  const extractMutation = useMutation({
    mutationFn: () => fetchApi(`/extract/coi/${coiId}`, { method: "POST" }),
    onSuccess: (data: OcrExtractionResult) => {
      setResult(data);
      // Auto-seleccionar campos con alta confianza (> 0.7)
      const highConfidenceFields = new Set<string>();
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === "object" && "confidence" in value) {
          const field = value as ExtractedField;
          if (field.confidence > 0.7) {
            highConfidenceFields.add(key);
          }
        }
      });
      setSelectedFields(highConfidenceFields);
      onSuccess?.(data);
      console.log("✓ OCR extraction successful");
    },
    onError: (error) => {
      console.error("✗ OCR extraction failed:", error);
      setResult({ confidence: 0 });
    },
  });

  // Apply extracted data - ENDPOINT CORREGIDO: PATCH /extract/coi/:id/apply
  const applyMutation = useMutation({
    mutationFn: (payload: ApplyOcrPayload) =>
      fetchApi(`/extract/coi/${coiId}/apply`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coi", coiId] });
      setIsOpen(false);
      setResult(null);
      setSelectedFields(new Set());
      console.log("✓ OCR data applied successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to apply OCR data:", error);
    },
  });

  const handleExtract = () => {
    setIsOpen(true);
    setResult(null);
    setSelectedFields(new Set());
    extractMutation.mutate();
  };

  const handleApply = () => {
    if (!result) return;

    const payload: ApplyOcrPayload = {};

    // Construir payload solo con campos seleccionados
    selectedFields.forEach((fieldName) => {
      const field = result[
        fieldName as keyof OcrExtractionResult
      ] as ExtractedField;
      if (field && "value" in field) {
        (payload as any)[fieldName] = field.value;
      }
    });

    applyMutation.mutate(payload);
  };

  const toggleField = (fieldName: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <>
      {/* Extract Button */}
      <button
        onClick={handleExtract}
        disabled={extractMutation.isPending}
        className="btn btn-ghost"
      >
        {extractMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Extracting...
          </>
        ) : (
          <>
            <FileSearch className="h-4 w-4" />
            Extract from PDF
          </>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/10 rounded-lg">
                  <FileSearch className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">OCR Extraction</h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Review and apply extracted data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {extractMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-brand animate-spin mb-4" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Processing PDF with OCR...
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    This may take a few seconds
                  </p>
                </div>
              ) : result ? (
                result.confidence === 0 ? (
                  // Error state
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Extraction Failed
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
                      Could not extract data from the PDF. The document may be a
                      scanned image or have poor quality.
                    </p>
                  </div>
                ) : (
                  // Success state
                  <div className="space-y-6">
                    {/* Overall Confidence Score */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900 dark:text-green-100">
                            Extraction Successful
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {(result.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300">
                            Overall Confidence
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Review and select:</strong> Check the extracted
                        fields below. Fields with high confidence are
                        pre-selected. Uncheck any incorrect values before
                        applying.
                      </p>
                    </div>

                    {/* Extracted Fields - Organized by category */}
                    <div className="space-y-6">
                      {/* Basic Information */}
                      {(result.insuredName ||
                        result.producer ||
                        result.certificateHolder) && (
                        <FieldSection title="Basic Information">
                          {result.insuredName && (
                            <ExtractedFieldRow
                              label="Insured Name"
                              field={result.insuredName}
                              fieldName="insuredName"
                              isSelected={selectedFields.has("insuredName")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                            />
                          )}
                          {result.producer && (
                            <ExtractedFieldRow
                              label="Producer"
                              field={result.producer}
                              fieldName="producer"
                              isSelected={selectedFields.has("producer")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                            />
                          )}
                          {result.certificateHolder && (
                            <ExtractedFieldRow
                              label="Certificate Holder"
                              field={result.certificateHolder}
                              fieldName="certificateHolder"
                              isSelected={selectedFields.has(
                                "certificateHolder"
                              )}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                            />
                          )}
                        </FieldSection>
                      )}

                      {/* Dates */}
                      {(result.effectiveDate || result.expirationDate) && (
                        <FieldSection title="Policy Dates">
                          {result.effectiveDate && (
                            <ExtractedFieldRow
                              label="Effective Date"
                              field={result.effectiveDate}
                              fieldName="effectiveDate"
                              isSelected={selectedFields.has("effectiveDate")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) =>
                                new Date(val as string).toLocaleDateString()
                              }
                            />
                          )}
                          {result.expirationDate && (
                            <ExtractedFieldRow
                              label="Expiration Date"
                              field={result.expirationDate}
                              fieldName="expirationDate"
                              isSelected={selectedFields.has("expirationDate")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) =>
                                new Date(val as string).toLocaleDateString()
                              }
                            />
                          )}
                        </FieldSection>
                      )}

                      {/* Coverage Limits */}
                      {(result.generalLiabLimit ||
                        result.autoLiabLimit ||
                        result.umbrellaLimit) && (
                        <FieldSection title="Coverage Limits">
                          {result.generalLiabLimit && (
                            <ExtractedFieldRow
                              label="General Liability Limit"
                              field={result.generalLiabLimit}
                              fieldName="generalLiabLimit"
                              isSelected={selectedFields.has(
                                "generalLiabLimit"
                              )}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) =>
                                `$${(val as number).toLocaleString()}`
                              }
                            />
                          )}
                          {result.autoLiabLimit && (
                            <ExtractedFieldRow
                              label="Auto Liability Limit"
                              field={result.autoLiabLimit}
                              fieldName="autoLiabLimit"
                              isSelected={selectedFields.has("autoLiabLimit")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) =>
                                `$${(val as number).toLocaleString()}`
                              }
                            />
                          )}
                          {result.umbrellaLimit && (
                            <ExtractedFieldRow
                              label="Umbrella Limit"
                              field={result.umbrellaLimit}
                              fieldName="umbrellaLimit"
                              isSelected={selectedFields.has("umbrellaLimit")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) =>
                                `$${(val as number).toLocaleString()}`
                              }
                            />
                          )}
                        </FieldSection>
                      )}

                      {/* Coverage Flags */}
                      {(result.workersComp ||
                        result.additionalInsured ||
                        result.waiverOfSubrogation) && (
                        <FieldSection title="Coverage Features">
                          {result.workersComp && (
                            <ExtractedFieldRow
                              label="Workers Compensation"
                              field={result.workersComp}
                              fieldName="workersComp"
                              isSelected={selectedFields.has("workersComp")}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) => (val ? "Yes" : "No")}
                            />
                          )}
                          {result.additionalInsured && (
                            <ExtractedFieldRow
                              label="Additional Insured"
                              field={result.additionalInsured}
                              fieldName="additionalInsured"
                              isSelected={selectedFields.has(
                                "additionalInsured"
                              )}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) => (val ? "Yes" : "No")}
                            />
                          )}
                          {result.waiverOfSubrogation && (
                            <ExtractedFieldRow
                              label="Waiver of Subrogation"
                              field={result.waiverOfSubrogation}
                              fieldName="waiverOfSubrogation"
                              isSelected={selectedFields.has(
                                "waiverOfSubrogation"
                              )}
                              onToggle={toggleField}
                              getConfidenceColor={getConfidenceColor}
                              getConfidenceBadge={getConfidenceBadge}
                              formatValue={(val) => (val ? "Yes" : "No")}
                            />
                          )}
                        </FieldSection>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Review carefully:</strong> OCR accuracy depends
                        on document quality. Always verify extracted values
                        match the original document before applying.
                      </p>
                    </div>
                  </div>
                )
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost flex-1"
                disabled={applyMutation.isPending}
              >
                Cancel
              </button>
              {result && result.confidence > 0 && (
                <button
                  onClick={handleApply}
                  className="btn btn-primary flex-1"
                  disabled={
                    applyMutation.isPending || selectedFields.size === 0
                  }
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    `Apply ${selectedFields.size} field${
                      selectedFields.size !== 1 ? "s" : ""
                    }`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper Components
function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface ExtractedFieldRowProps {
  label: string;
  field: ExtractedField;
  fieldName: string;
  isSelected: boolean;
  onToggle: (fieldName: string) => void;
  getConfidenceColor: (confidence: number) => string;
  getConfidenceBadge: (confidence: number) => string;
  formatValue?: (value: any) => string;
}

function ExtractedFieldRow({
  label,
  field,
  fieldName,
  isSelected,
  onToggle,
  getConfidenceColor,
  getConfidenceBadge,
  formatValue,
}: ExtractedFieldRowProps) {
  const displayValue = formatValue
    ? formatValue(field.value)
    : String(field.value);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(fieldName)}
        className="mt-1 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="text-xs font-medium text-neutral-500">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${getConfidenceColor(
                field.confidence
              )}`}
            >
              {(field.confidence * 100).toFixed(0)}%
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                field.confidence >= 0.8
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : field.confidence >= 0.6
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {getConfidenceBadge(field.confidence)}
            </span>
          </div>
        </div>
        <p className="text-sm font-medium break-words">{displayValue}</p>
        {field.evidence && (
          <p className="text-xs text-neutral-500 mt-1 italic">
            Found: "{field.evidence.text}"
            {field.evidence.section && ` in ${field.evidence.section}`}
          </p>
        )}
      </div>
    </div>
  );
}
