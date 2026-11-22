import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Every error response has this shape, so clients can branch on `code`. */
export interface ErrorBody {
  error: {
    /** Stable, machine-readable identifier, e.g. `not_found`. */
    code: string;
    /** Human-readable explanation, for logs; not meant for end users. */
    message: string;
    /** Correlates the response with the Worker's logs. */
    requestId?: string;
  };
}

/** An expected failure that maps to a specific HTTP status and error code. */
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorBody(code: string, message: string, requestId?: string): ErrorBody {
  return { error: { code, message, ...(requestId === undefined ? {} : { requestId }) } };
}
