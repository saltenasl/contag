import { PrismaClient } from '@prisma/client'

it('database is on', async () => {
  const prisma = new PrismaClient()

  await expect(prisma.$queryRaw`SELECT 1;`).resolves.not.toThrow()
  await prisma.$disconnect()
})
