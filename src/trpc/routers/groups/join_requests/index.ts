import { createTRPCRouter } from '@/trpc/init'
import { requestJoinProcedure } from './request.procedure'
import { approveJoinProcedure } from './approve.procedure'
import { rejectJoinProcedure } from './reject.procedure'
import { listJoinRequestsProcedure } from './listRequests.procedure'

export const groupJoinRequestsRouter = createTRPCRouter({
  request: requestJoinProcedure,
  approve: approveJoinProcedure,
  reject: rejectJoinProcedure,
  listRequests: listJoinRequestsProcedure,
})
