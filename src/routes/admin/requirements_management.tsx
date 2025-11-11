// src/pages/admin/RequirementsManagement.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building as BuildingIcon,
  Edit2,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoadingOverlay } from "../../components";
import { fetchApi } from "../../lib/api";
import { Building } from "../../types";
import {
  CreateRequirementDto,
  Requirement,
  UpdateRequirementDto,
} from "../../types/requirements.types";

export default function RequirementsManagement() {
  const { id } = useParams({ from: "/admin/buildings/$id/requirements" });
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] =
    useState<Requirement | null>(null);
  const queryClient = useQueryClient();

  // Fetch building - endpoint: GET /buildings/:id
  const { data: building, isLoading: buildingLoading } = useQuery<Building>({
    queryKey: ["building", id],
    queryFn: () => fetchApi(`/buildings/${id}`),
  });

  // Fetch requirements - endpoint: GET /buildings/:id/requirements
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery<
    Requirement[]
  >({
    queryKey: ["requirements", id],
    queryFn: () => fetchApi(`/buildings/${id}/requirements`),
  });

  // Create requirement mutation - endpoint: POST /buildings/:id/requirements
  const createMutation = useMutation({
    mutationFn: (data: CreateRequirementDto | UpdateRequirementDto) =>
      fetchApi(`/buildings/${id}/requirements`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements", id] });
      setIsCreateModalOpen(false);
      console.log("✓ Requirement created successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to create requirement:", error);
    },
  });

  // Update requirement mutation - endpoint: PATCH /requirements/:id
  const updateMutation = useMutation({
    mutationFn: ({
      reqId,
      data,
    }: {
      reqId: string;
      data: UpdateRequirementDto;
    }) =>
      fetchApi(`/requirements/${reqId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements", id] });
      setEditingRequirement(null);
      console.log("✓ Requirement updated successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to update requirement:", error);
    },
  });

  // Delete requirement mutation - endpoint: DELETE /requirements/:id
  const deleteMutation = useMutation({
    mutationFn: (reqId: string) =>
      fetchApi(`/requirements/${reqId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements", id] });
      console.log("✓ Requirement deleted successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to delete requirement:", error);
    },
  });

  const handleDelete = async (requirement: Requirement) => {
    if (
      window.confirm(
        `Are you sure you want to delete this requirement? Vendors will no longer need to meet "${requirement.type}".`
      )
    ) {
      deleteMutation.mutate(requirement.id);
    }
  };

  if (buildingLoading || requirementsLoading) return <LoadingOverlay />;
  if (!building) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Building not found</h3>
        <button
          onClick={() => navigate({ to: "/admin/buildings" })}
          className="btn btn-primary mt-4"
        >
          Back to Buildings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate({ to: "/admin/buildings" })}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Buildings
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand/10 rounded-lg">
                <BuildingIcon className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {building.name}
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {building.address}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Configure insurance requirements for vendors at this building
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Requirement
          </button>
        </div>
      </div>

      {/* Requirements List */}
      {requirements.length === 0 ? (
        <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onEdit={setEditingRequirement}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Requirement Modal */}
      {isCreateModalOpen && (
        <RequirementModal
          title="Create New Requirement"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Requirement Modal */}
      {editingRequirement && (
        <RequirementModal
          title="Edit Requirement"
          requirement={editingRequirement}
          onClose={() => setEditingRequirement(null)}
          onSubmit={(data) =>
            updateMutation.mutate({ reqId: editingRequirement.id, data })
          }
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Requirement Card Component
function RequirementCard({
  requirement,
  onEdit,
  onDelete,
}: {
  requirement: Requirement;
  onEdit: (req: Requirement) => void;
  onDelete: (req: Requirement) => void;
}) {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-brand/10 rounded-lg">
          <Shield className="h-5 w-5 text-brand" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(requirement)}
            className="p-2 text-neutral-600 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Edit requirement"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(requirement)}
            className="p-2 text-neutral-600 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Delete requirement"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{requirement.type}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        {requirement.description}
      </p>

      {requirement.minimumAmount && (
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-xs text-neutral-500">Minimum Coverage:</span>
          <p className="text-sm font-semibold">
            ${requirement.minimumAmount.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// Form data type
type RequirementFormData = {
  type: string;
  description: string;
  minimumAmount?: string;
};

// Requirement Modal Component
function RequirementModal({
  title,
  requirement,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string;
  requirement?: Requirement;
  onClose: () => void;
  onSubmit: (data: CreateRequirementDto | UpdateRequirementDto) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequirementFormData>({
    defaultValues: requirement
      ? {
          type: requirement.type,
          description: requirement.description,
          minimumAmount: requirement.minimumAmount?.toString() || "",
        }
      : { type: "", description: "", minimumAmount: "" },
  });

  const onFormSubmit = (data: RequirementFormData) => {
    const submitData: CreateRequirementDto = {
      type: data.type,
      description: data.description,
      minimumAmount: data.minimumAmount
        ? parseFloat(data.minimumAmount)
        : undefined,
    };
    onSubmit(submitData);
  };

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
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Requirement Type *
            </label>
            <input
              {...register("type", { required: "Type is required" })}
              type="text"
              className="field"
              placeholder="e.g., General Liability"
            />
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              className="field"
              rows={3}
              placeholder="e.g., All vendors must carry general liability insurance"
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Minimum Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Coverage Amount{" "}
              <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              {...register("minimumAmount", {
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: "Invalid amount format",
                },
              })}
              type="text"
              className="field"
              placeholder="e.g., 1000000"
            />
            {errors.minimumAmount && (
              <p className="text-sm text-red-600 mt-1">
                {errors.minimumAmount.message}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-1">
              Enter amount in dollars (e.g., 1000000 for $1M)
            </p>
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
              {isSubmitting ? "Saving..." : requirement ? "Update" : "Create"}
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
      <Shield className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Requirements Yet</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        Set insurance requirements for vendors working at this building to
        ensure compliance and safety.
      </p>
      <button onClick={onCreateClick} className="btn btn-primary">
        <Plus className="h-4 w-4" />
        Add First Requirement
      </button>
    </div>
  );
}
