type ToastHandler = (opts: { message: string; type?: 'success' | 'error' | 'info'; duration?: number }) => void;

let handler: ToastHandler | null = null;

export function registerToastHandler(h: ToastHandler) {
  handler = h;
}

export function unregisterToastHandler() {
  handler = null;
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
  if (handler) {
    try { handler({ message, type, duration }); } catch (e) { /* ignore */ }
  } else {
    // Fallback to console so we can see messages in logs if no UI registered
    // eslint-disable-next-line no-console
    console.warn('[toastService] showToast called but no handler registered:', message);
  }
}
