import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema.ts";

export const db = drizzle("file:./bird.db", { schema });
