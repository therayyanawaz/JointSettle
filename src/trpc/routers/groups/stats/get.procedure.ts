import { getGroupExpenses } from '@/lib/api'
import { verifyUserAuthenticated } from '@/lib/auth'
import {
  getTotalActiveUserPaidFor,
  getTotalActiveUserShare,
  getTotalGroupSpending,
} from '@/lib/totals'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupStatsProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      hash: z.string().length(8),
      participantId: z.string().optional(),
    }),
  )
  .query(async ({ input: { groupId, hash, participantId } }) => {
    const isAuthenticated = await verifyUserAuthenticated(hash)
    if (!isAuthenticated) {
      return { totalGroupSpendings: 0, totalParticipantSpendings: undefined, totalParticipantShare: undefined }
    }
    const expenses = await getGroupExpenses(groupId)
    const totalGroupSpendings = getTotalGroupSpending(expenses)

    const totalParticipantSpendings =
      participantId !== undefined
        ? getTotalActiveUserPaidFor(participantId, expenses)
        : undefined
    const totalParticipantShare =
      participantId !== undefined
        ? getTotalActiveUserShare(participantId, expenses)
        : undefined

    return {
      totalGroupSpendings,
      totalParticipantSpendings,
      totalParticipantShare,
    }
  })
