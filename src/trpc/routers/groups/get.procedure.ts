import { verifyUserAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      hash: z.string().length(8).optional(),
    }),
  )
  .query(async ({ input: { groupId, hash } }) => {
    if (!hash) {
      return { group: null }
    }
    const isAuthenticated = await verifyUserAuthenticated(hash)
    if (!isAuthenticated) {
      return { group: null }
    }
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { participants: true },
    })
    return { group }
  })
