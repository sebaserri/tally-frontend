import { useEffect, useState } from "react";
import { getQueuedRequestsCount, isRefreshingToken } from "../lib/api";
import { authEvents } from "../lib/auth-events";

export function useAuthRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    // Escuchar eventos
    const unsubscribeRecovered = authEvents.on("authRecovered", () => {
      setLastRefresh(new Date());
      setRefreshCount((prev) => prev + 1);
    });

    // Polling para estado actual
    const interval = setInterval(() => {
      setIsRefreshing(isRefreshingToken());
      setQueuedCount(getQueuedRequestsCount());
    }, 100);

    return () => {
      unsubscribeRecovered();
      clearInterval(interval);
    };
  }, []);

  return {
    isRefreshing,
    queuedCount,
    lastRefresh,
    refreshCount,
  };
}
