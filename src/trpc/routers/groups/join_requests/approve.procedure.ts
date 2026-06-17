import { verifyGroupOwnership } from '@/lib/auth'
import { randomId } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const approveJoinProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      hash: z.string().length(8),
      requestId: z.string().min(1),
    }),
  )
  .mutation(async ({ input: { groupId, hash, requestId } }) => {
    const isOwner = await verifyGroupOwnership(hash, groupId)
    if (!isOwner) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Only the group owner can approve join requests.',
      })
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    })
    if (!joinRequest || joinRequest.groupId !== groupId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Join request not found.' })
    }
    if (joinRequest.status !== 'pending') {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'This join request has already been resolved.',
      })
    }

    // Create the participant and mark request as approved
    await prisma.$transaction([
      prisma.participant.create({
        data: {
          id: randomId(),
          name: joinRequest.name,
          groupId,
          joinedAt: new Date(),
        },
      }),
      prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'approved', resolvedAt: new Date() },
      }),
    ])

    return { success: true }
  })
