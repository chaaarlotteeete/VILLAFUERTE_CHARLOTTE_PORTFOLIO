/** Prefer the Edge Function JSON `error` field over the generic non-2xx message. */
export async function edgeFunctionErrorMessage(
  error: { message: string; context?: unknown } | null | undefined,
  data: unknown,
): Promise<string> {
  if (data && typeof data === 'object') {
    const body = data as { error?: unknown; message?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }

  const context = error?.context
  if (context && typeof context === 'object' && 'json' in context) {
    try {
      const body = (await (
        context as { json: () => Promise<unknown> }
      ).json()) as { error?: unknown; message?: unknown }
      if (typeof body?.error === 'string' && body.error.trim()) return body.error
      if (typeof body?.message === 'string' && body.message.trim()) {
        return body.message
      }
    } catch {
      // Response body may already be consumed or non-JSON.
    }
  }

  return error?.message || 'Edge Function request failed'
}
