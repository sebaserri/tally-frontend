import { useCallback, useState } from "react";
import { fetchApi } from "../lib/api";
import { useToast } from "../ui/toast/ToastProvider";

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>(endpoint: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { show } = useToast();

  const execute = useCallback(
    async (fetchOptions?: any) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchApi<T>(endpoint, fetchOptions);
        setData(result);

        if (options.showSuccessToast) {
          show({
            variant: "success",
            title: "Done!",
            description: options.successMessage || "Operación exitosa",
          });
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options.showErrorToast) {
          show({
            variant: "error",
            title: "Error!",
            description: error.message || "Error al realizar la operación",
          });
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      endpoint,
      options.showSuccessToast,
      options.showErrorToast,
      options.successMessage,
      show,
    ]
  );

  return { data, loading, error, execute };
}
