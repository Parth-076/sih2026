import mongoose from "mongoose";
import { env } from "./env";

let connected = false;

export async function connectDB(): Promise<void> {
  if (connected) return;

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri);
    connected = true;
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB at ${redact(env.mongoUri)}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] MongoDB connection failed:", (err as Error).message);
    console.error(
      "[db] Is MongoDB running locally, or is MONGO_URI in backend/.env pointing " +
        "at a valid Atlas connection string?"
    );
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    connected = false;
    // eslint-disable-next-line no-console
    console.warn("[db] MongoDB disconnected");
  });
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function redact(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}
