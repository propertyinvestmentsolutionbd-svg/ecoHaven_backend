import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient({
  errorFormat: "minimal",
});

export default prisma;
