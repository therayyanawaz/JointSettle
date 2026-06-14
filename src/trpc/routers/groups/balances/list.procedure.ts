import { getGroupExpenses } from '@/lib/api'
import { verifyUserAuthenticated } from '@/lib/auth'
import {
  getBalances,
  getPublicBalances,
  getSuggestedReimbursements,
} from '@/lib/balances'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const listGroupBalancesProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1), hash: z.string().length(8) }))
  .query(async ({ input: { groupId, hash } }) => {
    const isAuthenticated = await verifyUserAuthenticated(hash)
    if (!isAuthenticated) {
      return { balances: {}, reimbursements: [] }
    }
    const expenses = await getGroupExpenses(groupId)
    const balances = getBalances(expenses)
    const reimbursements = getSuggestedReimbursements(balances)
    const publicBalances = getPublicBalances(reimbursements)

    return { balances: publicBalances, reimbursements }
  })
