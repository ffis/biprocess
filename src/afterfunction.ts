type RedisClientGet = (s: string) => Promise<string | null>;
type RedisClientSet = (s: string, value: string) => Promise<unknown>;
type RedisClientPublish = (channel: string, value: string) => Promise<number>;

export function afterFnWithRedis({
  get,
  set,
  publish,
}: {
  get: RedisClientGet;
  set: RedisClientSet;
  publish: RedisClientPublish;
}) {
  return function (value: unknown[], newkey: string): Promise<void> {
    return get(newkey).then((valueStringified: string | null) => {
      const stringfied = JSON.stringify(value);
      if (!valueStringified || valueStringified !== stringfied) {
        return set(newkey, stringfied)
          .then(() =>
            Promise.all([
              publish(newkey, stringfied),
              publish("updates", newkey),
            ]).then(() => {})
          )
          .catch((err) => {
            console.error("Error storing", newkey, err);
          });
      }

      return Promise.resolve();
    });
  };
}
