import { Client } from "stytch";

if (!process.env.STYTCH_PROJECT_ID) {
  throw new Error("STYTCH_PROJECT_ID environment variable is not set");
}

if (!process.env.STYTCH_SECRET) {
  throw new Error("STYTCH_SECRET environment variable is not set");
}

export const stytchClient = new Client({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
});
