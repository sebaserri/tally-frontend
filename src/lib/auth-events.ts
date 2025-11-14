// src/lib/auth-events.ts
type AuthEventType = "authExpired" | "authRecovered";
type AuthListener = () => void;

class AuthEvents {
  private listeners: Map<AuthEventType, Set<AuthListener>> = new Map();

  emit(event: AuthEventType): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener());
    }
  }

  on(event: AuthEventType, listener: AuthListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Retorna función de limpieza
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  off(event: AuthEventType, listener: AuthListener): void {
    this.listeners.get(event)?.delete(listener);
  }
}

export const authEvents = new AuthEvents();
