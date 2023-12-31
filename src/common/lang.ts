import type { OmitStrict } from "./types";

export class AssertionError extends Error {}

export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message || "assertion failed");
  }
}

export function assertNever(n: never): never {
  throw new Error(`never assertion failed, got value ${n}`);
}

export function recordKeys<T extends string>(o: Record<T, any>): T[] {
  return Object.keys(o) as T[];
}

export function typesafeUnionMembers<T extends string>(keys: Record<T, any>): T[] {
  return Object.keys(keys) as T[];
}

export function typesafePick<T extends object, K extends keyof T>(o: T, ...keys: K[]): Pick<T, K> {
  const copy: T = {} as any;
  keys.forEach((k) => {
    copy[k] = o[k];
  });
  return copy;
}

export function typesafeOmit<T extends object, K extends keyof T>(
  o: T,
  ...keys: K[]
): OmitStrict<T, K> {
  const copy = { ...o };
  keys.forEach((k) => {
    delete copy[k];
  });
  return copy;
}

export function typesafeMapValues<K extends string, V, U>(
  o: Record<K, V>,
  mapper: (value: V, key: K) => U,
): Record<K, U> {
  const result: Record<K, U> = {} as any;
  recordKeys(o).forEach((k) => {
    result[k] = mapper(o[k], k);
  });
  return result;
}
