type Callback<T> = (err: Error | null, reply: T) => void;

export interface RedisConnectionLike {
  get: (key: string, cb?: Callback<string | null> | undefined) => boolean;
  publish: (
    key: string,
    content: string,
    cb?: Callback<number> | undefined
  ) => boolean;
  set: (
    key: string,
    content: string,
    cb?: Callback<"OK"> | undefined
  ) => boolean;
  quit: () => void;
}

export interface RedisParameterLib {
  url: string;
}

export type createClientLike = (p: string) => RedisConnectionLike;

export function redisProvider(
  createClient: createClientLike,
  url: string
): RedisConnectionLike {
  return createClient(url);
}
