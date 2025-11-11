// src/pages/coi/admin-request.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LoadingOverlay } from "../../components";
import { useMutationToast } from "../../hooks/useMutationToast";
import { fetchApi } from "../../lib/api";

const requestSchema = z.object({
  buildingId: z.string().min(1, "Building is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  ttlHours: z.coerce.number().min(1).max(720),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface Building {
  id: string;
  name: string;
  address: string;
}

interface Vendor {
  id: string;
  legalName: string;
  contactEmail: string;
}

export default function AdminRequestCoiPage() {
  const navigate = useNavigate();
  const [vendorSearch, setVendorSearch] = useState("");
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);

  // Fetch buildings
  const { data: buildings = [], isLoading: loadingBuildings } = useQuery<
    Building[]
  >({
    queryKey: ["buildings"],
    queryFn: () => fetchApi("/buildings"),
  });

  // Search vendors
  const { data: vendors = [], isLoading: loadingVendors } = useQuery<Vendor[]>({
    queryKey: ["vendors", vendorSearch],
    queryFn: () => fetchApi(`/vendors/search?q=${vendorSearch}`),
    enabled: vendorSearch.length >= 2,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      buildingId: "",
      vendorId: "",
      ttlHours: 168, // 7 days default
    },
  });

  const selectedBuilding = watch("buildingId");
  const selectedVendor = watch("vendorId");

  // Create COI request mutation
  const createRequestMutation = useMutationToast(
    (data: RequestFormData) =>
      fetchApi("/coi/requests", {
        method: "POST",
        body: data,
      }),
    {
      success: {
        title: "COI Request Sent",
        description: "Vendor will receive an email with the submission link",
      },
      onSuccess: () => {
        navigate({ to: "/admin/cois" });
      },
    }
  );

  // Create vendor mutation
  const createVendorMutation = useMutationToast(
    (data: { legalName: string; contactEmail: string }) =>
      fetchApi<Vendor>("/vendors", {
        method: "POST",
        body: data,
      }),
    {
      success: {
        title: "Vendor Created",
        description: "New vendor has been added",
      },
      onSuccess: (data) => {
        setValue("vendorId", data.id);
        setShowNewVendorForm(false);
      },
    }
  );

  const onSubmit = (data: RequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const handleNewVendorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createVendorMutation.mutate({
      legalName: formData.get("legalName") as string,
      contactEmail: formData.get("contactEmail") as string,
    });
  };

  if (loadingBuildings) return <LoadingOverlay />;

  const building = buildings.find((b) => b.id === selectedBuilding);
  const vendor = vendors.find((v) => v.id === selectedVendor);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Request COI from Vendor
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Send a secure link for a vendor to upload their insurance certificate
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Building Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Select Building</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Building</label>
            <select {...register("buildingId")} className="field">
              <option value="">Choose a building...</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} - {b.address}
                </option>
              ))}
            </select>
            {errors.buildingId && (
              <p className="text-sm text-red-600 mt-1">
                {errors.buildingId.message}
              </p>
            )}
          </div>

          {building && (
            <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg">
              <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                Selected: {building.name}
              </p>
              <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">
                {building.address}
              </p>
            </div>
          )}
        </div>

        {/* Vendor Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            Select or Create Vendor
          </h3>

          {!showNewVendorForm ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search Vendor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Type vendor name..."
                    className="field pl-10"
                  />
                </div>
              </div>

              {vendorSearch.length >= 2 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {loadingVendors ? (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      Searching...
                    </p>
                  ) : vendors.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No vendors found. Try creating a new one.
                    </p>
                  ) : (
                    vendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setValue("vendorId", v.id);
                          setVendorSearch("");
                        }}
                        className="w-full text-left p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                      >
                        <p className="font-medium">{v.legalName}</p>
                        <p className="text-sm text-neutral-500">
                          {v.contactEmail}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {vendor && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Selected: {vendor.legalName}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {vendor.contactEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue("vendorId", "")}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowNewVendorForm(true)}
                className="mt-4 btn btn-ghost w-full"
              >
                <Plus className="h-4 w-4" />
                Create New Vendor
              </button>
            </>
          ) : (
            <form onSubmit={handleNewVendorSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Legal Name
                </label>
                <input
                  name="legalName"
                  required
                  className="field"
                  placeholder="ACME Plumbing Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Email
                </label>
                <input
                  name="contactEmail"
                  type="email"
                  required
                  className="field"
                  placeholder="contact@acmeplumbing.com"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createVendorMutation.isPending}
                >
                  Create Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewVendorForm(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <input type="hidden" {...register("vendorId")} />
          {errors.vendorId && (
            <p className="text-sm text-red-600 mt-2">
              {errors.vendorId.message}
            </p>
          )}
        </div>

        {/* Link Expiration */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Link Settings</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Link Expires In (hours)
            </label>
            <select
              {...register("ttlHours", { valueAsNumber: true })}
              className="field"
            >
              <option value={24}>24 hours (1 day)</option>
              <option value={72}>72 hours (3 days)</option>
              <option value={168}>168 hours (7 days) - Recommended</option>
              <option value={336}>336 hours (14 days)</option>
              <option value={720}>720 hours (30 days)</option>
            </select>
            <p className="text-xs text-neutral-500 mt-2">
              The vendor will receive an email with a secure link that expires
              after this time.
            </p>
          </div>
        </div>

        {/* Preview */}
        {building && vendor && (
          <div className="card p-6 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800">
            <h3 className="text-lg font-semibold mb-3 text-sky-900 dark:text-sky-100">
              Request Preview
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Vendor:</strong> {vendor.legalName} (
                {vendor.contactEmail})
              </p>
              <p>
                <strong>Building:</strong> {building.name}
              </p>
              <p>
                <strong>Link valid for:</strong> {watch("ttlHours")} hours
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={
            createRequestMutation.isPending ||
            !selectedBuilding ||
            !selectedVendor
          }
        >
          <Send className="h-4 w-4" />
          Send COI Request
        </button>
      </form>
    </div>
  );
}
