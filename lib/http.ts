export async function fetchWithTimeout(input: RequestInfo | URL, init: (RequestInit & { timeoutMs?: number }) = {}) {
  const { timeoutMs = 0, signal, ...rest } = init as any;
  if (!timeoutMs) {
    return fetch(input as any, { signal, ...rest });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, Math.max(0, timeoutMs));

  let combinedSignal: AbortSignal | undefined = controller.signal;
  if (signal) {
    const ac = new AbortController();
    function onAbort(this: AbortSignal) {
      try {
        ac.abort(this.reason);
      } catch {
        try {
          ac.abort();
        } catch {}
      }
    }
    if (signal.aborted) {
      onAbort.call(signal);
    } else {
      signal.addEventListener('abort', onAbort, { once: true });
    }
    controller.signal.addEventListener('abort', onAbort, { once: true });
    combinedSignal = ac.signal;
  }

  try {
    return await fetch(input as any, { ...rest, signal: combinedSignal });
  } finally {
    clearTimeout(timer);
  }
}
