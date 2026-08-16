import "server-only";

import ky from "ky";
import { z } from "zod";

const successEnvelopeSchema = z.strictObject({
  data: z.unknown(),
  success: z.literal(true),
  timestamp: z.string().min(1),
});

export class InternalApiConfigurationError extends Error {
  constructor() {
    super("INTERNAL_API_BASE_URL must be an HTTP(S) origin without a path.");
    this.name = "InternalApiConfigurationError";
  }
}

export function internalApiBaseUrl(value: string | undefined): URL | null {
  if (value === undefined || value.trim() === "") return null;

  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.hostname === "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }
    return url;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return null;
  }
}

export function parseSuccessEnvelope<T>(payload: unknown, dataSchema: z.ZodType<T>): T {
  const envelope = successEnvelopeSchema.parse(payload);
  return dataSchema.parse(envelope.data);
}

export async function getInternalApiData<T>(
  path: string,
  dataSchema: z.ZodType<T>,
  searchParams?: URLSearchParams,
): Promise<T> {
  const baseUrl = internalApiBaseUrl(process.env.INTERNAL_API_BASE_URL);
  if (baseUrl === null) throw new InternalApiConfigurationError();

  const url = new URL(`/api/v1/${path}`, baseUrl);
  if (searchParams !== undefined) url.search = searchParams.toString();
  const payload: unknown = await ky.get(url, { retry: { limit: 0 }, timeout: 10_000 }).json();

  return parseSuccessEnvelope(payload, dataSchema);
}
