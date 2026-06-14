import { getExpense } from '@/lib/api'
import { verifyUserAuthenticated } from '@/lib/auth'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupExpenseProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1), expenseId: z.string().min(1), hash: z.string().length(8) }))
  .query(async ({ input: { groupId, expenseId, hash } }) => {
    const isAuthenticated = await verifyUserAuthenticated(hash)
    if (!isAuthenticated) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' })
    }
    const expense = await getExpense(groupId, expenseId)
    if (!expense) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Expense not found',
      })
    }
    return { expense }
  })
