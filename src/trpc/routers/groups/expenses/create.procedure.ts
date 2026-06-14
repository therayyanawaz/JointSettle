import { createExpense } from '@/lib/api'
import { verifyUserAuthenticated } from '@/lib/auth'
import { expenseFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const createGroupExpenseProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      hash: z.string().length(8),
      expenseFormValues: expenseFormSchema,
      participantId: z.string().optional(),
    }),
  )
  .mutation(
    async ({ input: { groupId, hash, expenseFormValues, participantId } }) => {
      const isAuthenticated = await verifyUserAuthenticated(hash)
      if (!isAuthenticated) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' })
      }
      const expense = await createExpense(
        expenseFormValues,
        groupId,
        participantId,
      )
      return { expenseId: expense.id }
    },
  )
