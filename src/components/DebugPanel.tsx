import { useAuthRefresh } from "../hooks/useAuthRefresh";
import { useState } from "react";

export default function DebugPanel() {
  const { isRefreshing, queuedCount, lastRefresh, refreshCount } =
    useAuthRefresh();
  const [isOpen, setIsOpen] = useState(false);

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors text-sm font-mono"
      >
        🔍 Debug
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-sm font-mono text-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Auth Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className={isRefreshing ? "text-yellow-400" : "text-green-400"}
              >
                {isRefreshing ? "🔄 Refreshing" : "✓ Connected"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Queue:</span>
              <span className="text-blue-400">{queuedCount} requests</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Refreshes:</span>
              <span className="text-purple-400">{refreshCount}</span>
            </div>

            {lastRefresh && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Refresh:</span>
                <span className="text-gray-300">
                  {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Test Buttons */}
          <div className="mt-4 pt-3 border-t border-gray-700 space-y-2">
            <button
              onClick={() => {
                // Simular múltiples requests simultáneos
                Promise.all([
                  fetch("/api/cois"),
                  fetch("/api/cois"),
                  fetch("/api/cois"),
                ]).catch(() => {});
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition-colors"
            >
              Test Multiple Requests
            </button>
          </div>
        </div>
      )}
    </>
  );
}
