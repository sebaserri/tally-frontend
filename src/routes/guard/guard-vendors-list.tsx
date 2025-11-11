// src/pages/guard/GuardVendorsList.tsx
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Search, Users, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingOverlay } from "../../components";
import { fetchApi } from "../../lib/api";
import { Building, COIStatus } from "../../types";

// Extended vendor type for guard view
interface VendorWithAccess {
  id: string;
  legalName: string;
  contactEmail: string;
  contactPhone?: string;
  buildings: {
    buildingId: string;
    buildingName: string;
    coiStatus: COIStatus | null;
    expirationDate?: string;
  }[];
}

export default function GuardVendorsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string>("");

  // Fetch vendors with COI status - endpoint: GET /vendors/guard-view
  const { data: vendors = [], isLoading } = useQuery<VendorWithAccess[]>({
    queryKey: ["vendors-guard"],
    queryFn: () => fetchApi("/vendors/guard-view"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch buildings for filter
  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ["buildings"],
    queryFn: () => fetchApi("/buildings"),
  });

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        vendor.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

      // Building filter
      const matchesBuilding =
        buildingFilter === "" ||
        vendor.buildings.some((b) => b.buildingId === buildingFilter);

      return matchesSearch && matchesBuilding;
    });
  }, [vendors, searchTerm, buildingFilter]);

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Vendors Access List
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Quick reference for vendor access verification
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by vendor name or email..."
            className="field pl-10 w-full"
          />
        </div>

        {/* Building Filter */}
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="field w-full sm:w-64"
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Vendors"
          value={filteredVendors.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="With Active COI"
          value={
            filteredVendors.filter((v) =>
              v.buildings.some((b) => b.coiStatus === "APPROVED")
            ).length
          }
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Expired/Missing"
          value={
            filteredVendors.filter(
              (v) =>
                !v.buildings.some((b) => b.coiStatus === "APPROVED") &&
                v.buildings.length > 0
            ).length
          }
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <EmptyState hasSearch={searchTerm !== "" || buildingFilter !== ""} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Building Access
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredVendors.map((vendor) => (
                  <VendorRow key={vendor.id} vendor={vendor} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: "blue" | "green" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {label}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Vendor Row Component
function VendorRow({ vendor }: { vendor: VendorWithAccess }) {
  const hasAnyApprovedCOI = vendor.buildings.some(
    (b) => b.coiStatus === "APPROVED"
  );
  const hasExpiredOrMissing = vendor.buildings.some(
    (b) => b.coiStatus === "REJECTED" || b.coiStatus === null
  );

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
      <td className="px-6 py-4">
        <div className="font-medium">{vendor.legalName}</div>
      </td>
      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
        <div>{vendor.contactEmail}</div>
        {vendor.contactPhone && <div>{vendor.contactPhone}</div>}
      </td>
      <td className="px-6 py-4">
        {vendor.buildings.length === 0 ? (
          <span className="text-sm text-neutral-400">
            No buildings assigned
          </span>
        ) : (
          <div className="space-y-1">
            {vendor.buildings.map((building, idx) => (
              <div key={idx} className="text-sm">
                {building.buildingName}
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-center">
          {hasAnyApprovedCOI ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
              <CheckCircle className="h-3.5 w-3.5" />
              Active
            </span>
          ) : hasExpiredOrMissing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
              <XCircle className="h-3.5 w-3.5" />
              No Access
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              <AlertCircle className="h-3.5 w-3.5" />
              Pending
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// Empty State Component
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="card p-12 text-center">
      <Users className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {hasSearch ? "No Vendors Found" : "No Vendors Yet"}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {hasSearch
          ? "Try adjusting your search or filters"
          : "Vendors will appear here once they're added to the system"}
      </p>
    </div>
  );
}
