import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function resolveSqliteUrl(url: string): string {
  if (!url.startsWith("file:")) {
    return url;
  }

  const filePart = url.slice(5);
  if (path.isAbsolute(filePart)) {
    return url;
  }

  const normalized = filePart.replace(/^\.\//, "");
  return `file:${path.join(process.cwd(), normalized)}`;
}

const rawConnectionString = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const connectionString = resolveSqliteUrl(rawConnectionString);
const adapter = new PrismaBetterSqlite3({ url: connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
