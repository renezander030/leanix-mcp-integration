import { randomUUID } from 'node:crypto';
export function createSuccessResponse(result) {
  return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
}
export function createErrorResponse(error, context) {
  const id = randomUUID();
  // Neither a remote message nor its stack/body is safe to log by default.
  // Keep details in an operator-controlled, explicitly redacted diagnostic sink.
  console.error(JSON.stringify({ event: 'tool_error', correlation_id: id }));
  return { isError: true, content: [{ type: 'text', text: `Operation failed. Reference: ${id}` }] };
}
export function withErrorHandling(fn, operation) {
  return async (...args) => {
    try { return createSuccessResponse(await fn(...args)); }
    catch (error) { return createErrorResponse(error, operation); }
  };
}
