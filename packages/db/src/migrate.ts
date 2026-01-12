import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_URL || "./local-review.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log("Running migrations...");
migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
console.log("Migrations complete!");

sqlite.close();
