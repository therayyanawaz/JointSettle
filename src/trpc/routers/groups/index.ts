import { createTRPCRouter } from '@/trpc/init'
import { activitiesRouter } from '@/trpc/routers/groups/activities'
import { groupBalancesRouter } from '@/trpc/routers/groups/balances'
import { createGroupProcedure } from '@/trpc/routers/groups/create.procedure'
import { deleteGroupProcedure } from '@/trpc/routers/groups/delete.procedure'
import { groupExpensesRouter } from '@/trpc/routers/groups/expenses'
import { getGroupProcedure } from '@/trpc/routers/groups/get.procedure'
import { groupImportsRouter } from '@/trpc/routers/groups/imports'
import { groupStatsRouter } from '@/trpc/routers/groups/stats'
import { updateGroupProcedure } from '@/trpc/routers/groups/update.procedure'
import { getGroupDetailsProcedure } from './getDetails.procedure'
import { groupLeaveRouter } from './leave/index'
import { groupJoinRequestsRouter } from './join_requests/index'
import { listByUserProcedure } from './listByUser.procedure'
import { listGroupsProcedure } from './list.procedure'
import { checkNameProcedure } from './checkName.procedure'

export const groupsRouter = createTRPCRouter({
  expenses: groupExpensesRouter,
  balances: groupBalancesRouter,
  stats: groupStatsRouter,
  activities: activitiesRouter,
  imports: groupImportsRouter,

  get: getGroupProcedure,
  getDetails: getGroupDetailsProcedure,
  list: listGroupsProcedure,
  listByUser: listByUserProcedure,
  joinRequests: groupJoinRequestsRouter,
  leave: groupLeaveRouter,
  create: createGroupProcedure,
  update: updateGroupProcedure,
  delete: deleteGroupProcedure,
  checkName: checkNameProcedure,
})
