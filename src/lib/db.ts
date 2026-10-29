import { PrismaClient } from "@prisma/client";

/** Un solo cliente por proceso: en desarrollo, Next recarga los módulos
 *  y sin esto abriría una conexión nueva en cada cambio. */
const global = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
