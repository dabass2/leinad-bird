import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema.ts";

// biome-ignore lint/style/noNonNullAssertion: <grrrr>
export const db = drizzle(process.env.DATABASE_URL!, { schema });
