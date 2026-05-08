const { PrismaClient } = require("@prisma/client");

const usePrisma = Boolean(process.env.DATABASE_URL);

const prisma = usePrisma
  ? new PrismaClient()
  : null;

module.exports = {
  prisma,
  usePrisma
};
