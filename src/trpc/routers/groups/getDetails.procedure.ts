import { getGroup, getGroupExpensesParticipants } from '@/lib/api'
import { verifyUserAuthenticated } from '@/lib/auth'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupDetailsProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1), hash: z.string().length(8) }))
  .query(async ({ input: { groupId, hash } }) => {
    const isAuthenticated = await verifyUserAuthenticated(hash)
    if (!isAuthenticated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found.',
      })
    }
    const group = await getGroup(groupId)
    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found.',
      })
    }

    const participantsWithExpenses = await getGroupExpensesParticipants(groupId)
    return { group, participantsWithExpenses }
  })
