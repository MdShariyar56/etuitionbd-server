import { MongoClient } from "mongodb";

export function getClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in .env.local");
  }
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || "etuitionbd");
}
