import { MongoClientOptions } from "mongodb";
import { Config } from "../../config";
import { MongoConnectionType } from "../../types";

export type connectLike = (
  url: string,
  options: MongoClientOptions
) => Promise<MongoConnectionType>;

export function connectMongo(
  connect: connectLike,
  config: Config
): Promise<MongoConnectionType> {
  const options: MongoClientOptions = config.mongodb.options
    ? config.mongodb.options
    : { useNewUrlParser: true, useUnifiedTopology: true };

  return connect(config.mongodb.url, options);
}
