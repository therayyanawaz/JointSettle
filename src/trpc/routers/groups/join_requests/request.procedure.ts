import { verifyUserAuthenticated } from '@/lib/auth'
import { randomId } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const requestJoinProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      hash: z.string().length(8),
      name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    }),
  )
  .mutation(async ({ input: { groupId, hash, name } }) => {
    const isAuthenticated = await verifyUserAuthenticated(hash)
    if (!isAuthenticated) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' })
    }

    // Check group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })
    if (!group) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' })
    }

    // Check if user already has a pending join request for this group
    const existingPending = await prisma.joinRequest.findFirst({
      where: {
        groupId,
        hash,
        status: 'pending',
      },
    })
    if (existingPending) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You already have a pending join request for this group.',
      })
    }

    // Check if a participant with the same name already exists
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        groupId,
        name: { equals: name, mode: 'insensitive' },
        leftAt: null,
      },
    })
    if (existingParticipant) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A participant with this name already exists in this group.',
      })
    }

    // Create the join request
    await prisma.joinRequest.create({
      data: {
        id: randomId(),
        groupId,
        name,
        hash,
        status: 'pending',
      },
    })

    return { success: true }
  })
