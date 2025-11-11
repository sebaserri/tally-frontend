// src/pages/admin/BuildingsManagement.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building as BuildingIcon, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoadingOverlay } from "../../../components";
import { fetchApi } from "../../../lib/api";
import { Building, CreateBuildingDto, UpdateBuildingDto } from "../../../types";

export default function BuildingsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const queryClient = useQueryClient();

  // Fetch buildings - endpoint: GET /buildings
  const { data: buildings = [], isLoading } = useQuery<Building[]>({
    queryKey: ["buildings"],
    queryFn: () => fetchApi("/buildings"),
  });

  // Create building mutation - endpoint: POST /buildings
  const createMutation = useMutation({
    mutationFn: (data: CreateBuildingDto | UpdateBuildingDto) =>
      fetchApi("/buildings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      setIsCreateModalOpen(false);
      console.log("✓ Building created successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to create building:", error);
    },
  });

  // Update building mutation - endpoint: PATCH /buildings/:id
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuildingDto }) =>
      fetchApi(`/buildings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      setEditingBuilding(null);
      console.log("✓ Building updated successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to update building:", error);
    },
  });

  // Delete building mutation - endpoint: DELETE /buildings/:id
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/buildings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      console.log("✓ Building deleted successfully");
    },
    onError: (error) => {
      console.error("✗ Failed to delete building:", error);
    },
  });

  const handleDelete = async (building: Building) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${building.name}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(building.id);
    }
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Buildings Management
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Create and manage buildings in your portfolio
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Building
        </button>
      </div>

      {/* Buildings Grid */}
      {buildings.length === 0 ? (
        <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              onEdit={setEditingBuilding}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Building Modal */}
      {isCreateModalOpen && (
        <BuildingModal
          title="Create New Building"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Building Modal */}
      {editingBuilding && (
        <BuildingModal
          title="Edit Building"
          building={editingBuilding}
          onClose={() => setEditingBuilding(null)}
          onSubmit={(data) =>
            updateMutation.mutate({ id: editingBuilding.id, data })
          }
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Building Card Component
function BuildingCard({
  building,
  onEdit,
  onDelete,
}: {
  building: Building;
  onEdit: (building: Building) => void;
  onDelete: (building: Building) => void;
}) {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-brand/10 rounded-lg">
          <BuildingIcon className="h-6 w-6 text-brand" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(building)}
            className="p-2 text-neutral-600 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Edit building"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(building)}
            className="p-2 text-neutral-600 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Delete building"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{building.name}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        {building.address}
      </p>

      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-neutral-500">
          Created {new Date(building.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// Form data type that works for both create and edit
type BuildingFormData = {
  name: string;
  address: string;
};

// Building Modal Component
function BuildingModal({
  title,
  building,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string;
  building?: Building;
  onClose: () => void;
  onSubmit: (data: CreateBuildingDto | UpdateBuildingDto) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuildingFormData>({
    defaultValues: building
      ? { name: building.name, address: building.address }
      : { name: "", address: "" },
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
          {/* Building Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Building Name *
            </label>
            <input
              {...register("name", { required: "Building name is required" })}
              type="text"
              className="field"
              placeholder="e.g., Tower Plaza"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Address *</label>
            <textarea
              {...register("address", { required: "Address is required" })}
              className="field"
              rows={3}
              placeholder="e.g., 123 Main St, New York, NY 10001"
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">
                {errors.address.message}
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
              {isSubmitting ? "Saving..." : building ? "Update" : "Create"}
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
      <BuildingIcon className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Buildings Yet</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        Start by adding your first building to manage certificates of insurance
        for your properties.
      </p>
      <button onClick={onCreateClick} className="btn btn-primary">
        <Plus className="h-4 w-4" />
        Add Your First Building
      </button>
    </div>
  );
}
