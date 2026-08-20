// Single shared Prisma Client instance for the whole app.
//
// Everything that needs the database imports THIS file, not
// "@prisma/client" directly. That keeps Prisma itself an implementation
// detail — if we ever swapped ORMs, only this file (and the query code
// that calls it) would need to change.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
