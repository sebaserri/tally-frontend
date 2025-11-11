// src/pages/vendor.tsx
export default function VendorPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Gestiona tus certificados de seguro (COI)
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Mis COI Requests</h2>
        <p className="text-neutral-500">
          Aquí verás las solicitudes de COI que te han enviado.
        </p>
      </div>
    </div>
  );
}
