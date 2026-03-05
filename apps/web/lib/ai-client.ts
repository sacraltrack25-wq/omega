/**
 * Client-side wrapper for the AI Engine API
 */

import type { NetworkType, OmegaResponse } from "@/types";

const BASE_URL = process.env.AI_ENGINE_URL ?? "http://localhost:4000";
const API_KEY  = process.env.AI_ENGINE_API_KEY ?? "";

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: {
      "Content-Type":  "application/json",
      "x-api-key":     API_KEY,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`AI Engine ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const aiClient = {
  query(
    type: NetworkType,
    input: unknown,
    context?: Record<string, unknown>,
    options?: { multimodal?: boolean },
  ) {
    return call<OmegaResponse>("/query", {
      type,
      input,
      context,
      multimodal: options?.multimodal ?? false,
    });
  },
  learn(type: NetworkType, key: string, data: number[], source: string) {
    return call<{ ok: boolean }>("/learn", { type, key, data, source });
  },
  consolidate() {
    return call<{ ok: boolean; pruned: Record<NetworkType, number> }>("/consolidate");
  },
  status() {
    return call<unknown>("/status");
  },
  health() {
    return call<{ ok: boolean; ready: boolean }>("/health");
  },
};
