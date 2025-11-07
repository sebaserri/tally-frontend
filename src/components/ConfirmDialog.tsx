import { createContext, useCallback, useContext, useState } from "react";

type ConfirmOpts = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

type Ctx = (opts: ConfirmOpts) => Promise<boolean>;

const ConfirmCtx = createContext<Ctx | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx)
    throw new Error("useConfirm must be used within <ConfirmProvider/>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    opts: ConfirmOpts;
    resolve?: (v: boolean) => void;
  }>({ open: false, opts: {} });

  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, opts, resolve });
    });
  }, []);

  const close = (v: boolean) => {
    state.resolve?.(v);
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[70] grid place-items-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-[71] w-[92%] max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">
              {state.opts.title ?? "Confirmar acción"}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {state.opts.message ?? "¿Estás seguro?"}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => close(false)}
                autoFocus
              >
                {state.opts.cancelText ?? "Cancelar"}
              </button>
              <button className="btn btn-primary" onClick={() => close(true)}>
                {state.opts.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
