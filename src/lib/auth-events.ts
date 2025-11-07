// Event bus mínimo para notificar expiración y recuperación de sesión
export type AuthEvents = {
  authExpired: () => void;
  authRecovered: () => void;
};

type Handler = (...args: any[]) => void;

class TinyEmitter<T extends Record<string, (...a: any[]) => void>> {
  private map = new Map<keyof T, Set<Handler>>();

  on<K extends keyof T>(type: K, cb: T[K]) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(cb as Handler);
    return () => this.off(type, cb);
  }
  off<K extends keyof T>(type: K, cb: T[K]) {
    this.map.get(type)?.delete(cb as Handler);
  }
  emit<K extends keyof T>(type: K, ...args: Parameters<T[K]>) {
    this.map.get(type)?.forEach((cb) => (cb as any)(...args));
  }
}

export const authEvents = new TinyEmitter<AuthEvents>();
