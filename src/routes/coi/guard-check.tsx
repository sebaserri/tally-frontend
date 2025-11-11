// src/pages/coi/guard-check.tsx
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building as BuildingIcon,
  CheckCircle,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { LoadingOverlay, QrCodeModal } from "../../components";
import { fetchApi } from "../../lib/api";
import { AccessCheckResult, Building, Vendor } from "../../types";

export default function GuardCheckPage() {
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [checkResult, setCheckResult] = useState<AccessCheckResult | null>(
    null
  );

  // Fetch buildings
  const { data: buildings = [], isLoading: loadingBuildings } = useQuery<
    Building[]
  >({
    queryKey: ["buildings"],
    queryFn: () => fetchApi("/buildings"),
  });

  // Search vendors
  const { data: vendors = [], isLoading: loadingVendors } = useQuery<Vendor[]>({
    queryKey: ["vendors-search", vendorSearch],
    queryFn: () => fetchApi(`/vendors/search?q=${vendorSearch}`),
    enabled: vendorSearch.length >= 2,
  });

  // Check access
  const { refetch: checkAccess, isFetching: checking } =
    useQuery<AccessCheckResult>({
      queryKey: ["access-check", selectedVendor?.id, selectedBuilding],
      queryFn: () => {
        if (!selectedVendor?.id || !selectedBuilding) {
          throw new Error("Missing vendor or building");
        }
        return fetchApi(
          `/access/check?vendorId=${selectedVendor.id}&buildingId=${selectedBuilding}`
        );
      },
      enabled: false, // Manual trigger
    });

  const handleCheck = async () => {
    if (!selectedVendor || !selectedBuilding) return;
    const { data } = await checkAccess();
    setCheckResult(data || null);
  };

  const handleReset = () => {
    setSelectedVendor(null);
    setVendorSearch("");
    setCheckResult(null);
  };

  if (loadingBuildings) return <LoadingOverlay />;

  const building = buildings.find((b) => b.id === selectedBuilding);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Vendor Access Check
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Verify if a vendor is authorized to enter the building
        </p>
      </div>

      {/* Building Selection */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">
          Select Building
        </label>
        <select
          value={selectedBuilding}
          onChange={(e) => {
            setSelectedBuilding(e.target.value);
            setCheckResult(null);
          }}
          className="field"
        >
          <option value="">Choose a building...</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {building && (
          <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg flex items-start gap-3">
            <BuildingIcon className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
            <div>
              <p className="font-medium text-sky-900 dark:text-sky-100">
                {building.name}
              </p>
              <p className="text-sm text-sky-700 dark:text-sky-300">
                {building.address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Search */}
      {selectedBuilding && (
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">
            Search Vendor
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              value={vendorSearch}
              onChange={(e) => {
                setVendorSearch(e.target.value);
                setCheckResult(null);
              }}
              placeholder="Type vendor name..."
              className="field pl-10 text-lg"
              disabled={!!selectedVendor}
            />
          </div>

          {selectedVendor ? (
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg">
                  {selectedVendor.legalName}
                </p>
                <p className="text-sm text-neutral-500">
                  {selectedVendor.contactEmail}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Clear
              </button>
            </div>
          ) : vendorSearch.length >= 2 ? (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {loadingVendors ? (
                <p className="text-sm text-neutral-500 text-center py-8">
                  Searching...
                </p>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">
                  No vendors found with "{vendorSearch}"
                </p>
              ) : (
                vendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVendor(v);
                      setVendorSearch("");
                    }}
                    className="w-full text-left p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 hover:border-brand hover:bg-brand/5 transition"
                  >
                    <p className="font-semibold text-lg">{v.legalName}</p>
                    <p className="text-sm text-neutral-500">{v.contactEmail}</p>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Check Button */}
      {selectedVendor && selectedBuilding && !checkResult && (
        <button
          onClick={handleCheck}
          disabled={checking}
          className="btn btn-primary w-full py-6 text-lg"
        >
          {checking ? "Checking..." : "Check Access"}
        </button>
      )}

      {/* Result */}
      {checkResult && selectedVendor && (
        <div
          className={`card p-8 text-center ${
            checkResult.status === "APTO"
              ? "bg-green-50 dark:bg-green-950/20 border-green-500"
              : "bg-red-50 dark:bg-red-950/20 border-red-500"
          }`}
        >
          {checkResult.status === "APTO" ? (
            <>
              <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                ✓ ACCESS GRANTED
              </h2>
              <p className="text-lg text-green-700 dark:text-green-300 mb-6">
                {selectedVendor.legalName} is authorized to enter
              </p>
              <div className="mt-4">
                <QrCodeModal
                  vendorId={selectedVendor.id}
                  buildingId={selectedBuilding}
                  vendorName={selectedVendor.legalName}
                  buildingName={building?.name}
                />
              </div>
              {checkResult.coi && (
                <div className="inline-block bg-white dark:bg-neutral-900 rounded-lg p-4 text-sm mt-4">
                  <p className="text-neutral-600 dark:text-neutral-400">
                    COI expires:{" "}
                    <strong>
                      {new Date(
                        checkResult.coi.expirationDate
                      ).toLocaleDateString()}
                    </strong>
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-20 w-20 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-2">
                ✗ ACCESS DENIED
              </h2>
              <p className="text-lg text-red-700 dark:text-red-300 mb-6">
                {selectedVendor.legalName} is not authorized
              </p>
              {checkResult.reasons && checkResult.reasons.length > 0 && (
                <div className="inline-block bg-white dark:bg-neutral-900 rounded-lg p-4 text-left">
                  <p className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">
                    Reasons:
                  </p>
                  <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                    {checkResult.reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <button onClick={handleReset} className="btn btn-ghost mt-8">
            Check Another Vendor
          </button>
        </div>
      )}

      {/* Quick Instructions */}
      {!selectedBuilding && (
        <div className="card p-6 bg-neutral-50 dark:bg-neutral-900">
          <h3 className="font-semibold mb-3">How to use:</h3>
          <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>1. Select the building</li>
            <li>2. Search and select the vendor</li>
            <li>3. Click "Check Access" to verify their COI status</li>
            <li>4. Grant or deny entry based on the result</li>
          </ol>
        </div>
      )}
    </div>
  );
}
