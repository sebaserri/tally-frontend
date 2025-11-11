// src/pages/admin/VendorsManagement.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Plus, Users, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoadingOverlay } from "../../../components";
import { fetchApi } from "../../../lib/api";
import { CreateVendorDto, Vendor } from "../../../types";

export default function VendorsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const queryClient = useQueryClient();

  // Fetch vendors - endpoint: GET /vendors/search?q=
  // Usamos el endpoint de búsqueda con query vacío para obtener todos
  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: () => fetchApi("/vendors/search?q="),
  });

  // Create vendor mutation - endpoint: POST /vendors
  const createMutation = useMutation({
    mutationFn: (data: CreateVendorDto) =>
      fetchApi("/vendors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setIsCreateModalOpen(false);
      console.log("✓ Vendor created successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to create vendor:", error);
    },
  });

  // Update phone mutation - endpoint: POST /vendors/:id/phone
  const updatePhoneMutation = useMutation({
    mutationFn: ({ id, contactPhone }: { id: string; contactPhone: string }) =>
      fetchApi(`/vendors/${id}/phone`, {
        method: "POST",
        body: JSON.stringify({ contactPhone }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setEditingVendor(null);
      console.log("✓ Vendor phone updated successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to update vendor phone:", error);
    },
  });

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendors Management
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Manage vendor companies and their contact information
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {/* Vendors List */}
      {vendors.length === 0 ? (
        <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Legal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium">{vendor.legalName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <Mail className="h-3.5 w-3.5" />
                        {vendor.contactEmail}
                      </div>
                      {vendor.contactPhone && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Phone className="h-3.5 w-3.5" />
                          {vendor.contactPhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingVendor(vendor)}
                      className="text-sm text-brand hover:underline"
                    >
                      Edit Phone
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Vendor Modal */}
      {isCreateModalOpen && (
        <VendorModal
          title="Create New Vendor"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Phone Modal */}
      {editingVendor && (
        <PhoneModal
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSubmit={(contactPhone) =>
            updatePhoneMutation.mutate({ id: editingVendor.id, contactPhone })
          }
          isSubmitting={updatePhoneMutation.isPending}
        />
      )}
    </div>
  );
}

// Form data type
type VendorFormData = {
  legalName: string;
  contactEmail: string;
};

// Vendor Modal Component (Create only)
function VendorModal({
  title,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (data: CreateVendorDto) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    defaultValues: { legalName: "", contactEmail: "" },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Legal Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Legal Name *
            </label>
            <input
              {...register("legalName", { required: "Legal name is required" })}
              type="text"
              className="field"
              placeholder="e.g., ACME Plumbing LLC"
            />
            {errors.legalName && (
              <p className="text-sm text-red-600 mt-1">
                {errors.legalName.message}
              </p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Contact Email *
            </label>
            <input
              {...register("contactEmail", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              className="field"
              placeholder="e.g., contact@acme.com"
            />
            {errors.contactEmail && (
              <p className="text-sm text-red-600 mt-1">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Phone Modal Component (Edit phone only)
function PhoneModal({
  vendor,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  vendor: Vendor;
  onClose: () => void;
  onSubmit: (contactPhone: string) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ contactPhone: string }>({
    defaultValues: { contactPhone: vendor.contactPhone || "" },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold">Edit Phone</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => onSubmit(data.contactPhone))}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              Vendor: <span className="font-normal">{vendor.legalName}</span>
            </label>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Contact Phone *
            </label>
            <input
              {...register("contactPhone", {
                required: "Phone is required",
              })}
              type="tel"
              className="field"
              placeholder="e.g., +1 (555) 123-4567"
            />
            {errors.contactPhone && (
              <p className="text-sm text-red-600 mt-1">
                {errors.contactPhone.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="card p-12 text-center">
      <Users className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Vendors Yet</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        Start by adding your first vendor company to track their certificates of
        insurance.
      </p>
      <button onClick={onCreateClick} className="btn btn-primary">
        <Plus className="h-4 w-4" />
        Add Your First Vendor
      </button>
    </div>
  );
}
