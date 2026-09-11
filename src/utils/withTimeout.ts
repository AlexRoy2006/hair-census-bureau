/**
 * REUSABLE ASYNC TIMEOUT UTILITY
 * -----------------------------------------------------------------------------
 * Wraps any promise with a hard timeout to prevent async operations from
 * hanging indefinitely in browser environments.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out",
): Promise<T> {
  let timer: any = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[MUDI TIMEOUT] ${errorMessage} (exceeded ${timeoutMs}ms)`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
