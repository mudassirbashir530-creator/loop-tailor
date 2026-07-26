import * as PrismaModule from '@prisma/client';

const PrismaClientClass = (PrismaModule as any).PrismaClient || class {};

const globalForPrisma = globalThis as unknown as { 
  prisma: any 
};

export const prisma = globalForPrisma.prisma || new PrismaClientClass();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
