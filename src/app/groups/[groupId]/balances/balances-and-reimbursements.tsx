'use client'

import { BalancesList } from '@/app/groups/[groupId]/balances-list'
import { ReimbursementList } from '@/app/groups/[groupId]/reimbursement-list'
import { TrackPage } from '@/components/track-page'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useCurrentGroup } from '../current-group-context'
import { useAuth } from '@/components/auth-provider'

export default function BalancesAndReimbursements() {
  const utils = trpc.useUtils()
  const { groupId, group } = useCurrentGroup()
  const { hash } = useAuth()
  const { data: balancesData, isLoading: balancesAreLoading } =
    trpc.groups.balances.list.useQuery({
      groupId,
      hash: hash!,
    })
  const t = useTranslations('Balances')

  useEffect(() => {
    utils.groups.balances.invalidate()
  }, [utils])

  const isLoading = balancesAreLoading || !balancesData || !group

  return (
    <>
      <TrackPage path={`/groups/${groupId}/balances`} />

      {/* Balances Section */}
      <div className="rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5 dark:shadow-[0_0_20px_hsl(var(--primary)_/_0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">₹</span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">{t('title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('description')}</p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/40 dark:bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <BalancesList
              balances={balancesData.balances}
              participants={group?.participants}
              currency={getCurrencyFromGroup(group)}
              groupId={groupId}
            />
          )}
        </div>
      </div>

      {/* Reimbursements Section */}
      <div className="mt-4 rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5 dark:shadow-[0_0_20px_hsl(var(--primary)_/_0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
            <span className="text-amber-700 dark:text-amber-400 font-bold text-lg">⇄</span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">{t('Reimbursements.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('Reimbursements.description')}</p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/40 dark:bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-20 mt-1" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24 mx-auto mt-3 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <ReimbursementList
              reimbursements={balancesData.reimbursements}
              participants={group?.participants}
              currency={getCurrencyFromGroup(group)}
              groupId={groupId}
            />
          )}
        </div>
      </div>
    </>
  )
}
