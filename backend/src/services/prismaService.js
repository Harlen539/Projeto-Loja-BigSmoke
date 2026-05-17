const { PrismaClient } = require("@prisma/client");

const usePrisma = Boolean(process.env.DATABASE_URL) && process.env.NODE_ENV !== "test";

const prisma = usePrisma
  ? new PrismaClient()
  : null;

module.exports = {
  prisma,
  usePrisma
};
