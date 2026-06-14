'use client'

import { Avatar } from '@/components/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Currency } from '@/lib/currency'
import { getCurrencyFromGroup } from '@/lib/utils'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { trpc } from '@/trpc/client'
import {
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  Minus,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState, useMemo } from 'react'

type Props = {
  participantId: string
  participantName: string
  groupId: string
  participants: { id: string; name: string }[]
  balanceTotal: number
  currency: Currency
}

type Contribution = {
  expenseId: string
  title: string
  expenseDate: Date
  amount: number
  paidById: string
  contribution: number // positive = they are owed, negative = they owe
  shareCount: number
  totalShares: number
}

export function BalanceDrillDown({
  participantId,
  participantName,
  groupId,
  participants,
  balanceTotal,
  currency,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const locale = useLocale()
  const { hash } = useAuth()

  const { data, isLoading } = trpc.groups.expenses.list.useInfiniteQuery(
    { groupId, limit: 500, hash: hash! },
    {
      getNextPageParam: ({ nextCursor }) => nextCursor,
      enabled: isOpen && !!hash,
    },
  )

  const contributions = useMemo(() => {
    if (!data) return []
    const allExpenses = data.pages.flatMap((p) => p.expenses)
    const result: Contribution[] = []

    for (const expense of allExpenses) {
      if (expense.paidBy.id === participantId) {
        // They paid — they're owed the total minus their own share
        const totalPaidForShares = expense.paidFor.reduce(
          (sum, pf) => sum + pf.shares,
          0,
        )
        let remaining = expense.amount
        expense.paidFor.forEach((pf, index) => {
          const isLast = index === expense.paidFor.length - 1
          const dividedAmount = isLast
            ? remaining
            : (expense.amount * pf.shares) / totalPaidForShares
          remaining -= dividedAmount

          if (pf.participant.id !== participantId) {
            // They paid for someone else — positive contribution (owed)
            const existing = result.find((c) => c.expenseId === expense.id)
            if (existing) {
              existing.contribution += Math.round(dividedAmount)
            } else {
              result.push({
                expenseId: expense.id,
                title: expense.title,
                expenseDate: expense.expenseDate,
                amount: expense.amount,
                paidById: expense.paidBy.id,
                contribution: Math.round(dividedAmount),
                shareCount: 1,
                totalShares: expense.paidFor.length,
              })
            }
          }
        })
      } else {
        // Someone else paid — check if this participant is in paidFor
        const paidForEntry = expense.paidFor.find(
          (pf) => pf.participant.id === participantId,
        )
        if (paidForEntry) {
          const totalPaidForShares = expense.paidFor.reduce(
            (sum, pf) => sum + pf.shares,
            0,
          )
          const dividedAmount =
            (expense.amount * paidForEntry.shares) / totalPaidForShares
          result.push({
            expenseId: expense.id,
            title: expense.title,
            expenseDate: expense.expenseDate,
            amount: expense.amount,
            paidById: expense.paidBy.id,
            contribution: -Math.round(dividedAmount),
            shareCount: 1,
            totalShares: expense.paidFor.length,
          })
        }
      }
    }

    // Sort by date descending
    result.sort(
      (a, b) =>
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime(),
    )
    return result
  }, [data, participantId])

  const totalFromExpenses = contributions.reduce(
    (sum, c) => sum + c.contribution,
    0,
  )

  if (balanceTotal === 0) return null

  return (
    <div className="mt-2 border-t border-blue-100/10 dark:border-blue-900/10 pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 w-full text-left"
      >
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        <span>Show breakdown ({contributions.length} expenses)</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1 animate-fade-in-up">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                >
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </>
          ) : contributions.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-1">
              No expenses found for this participant.
            </p>
          ) : (
            <>
              {contributions.map((c) => {
                const payer = participants.find(
                  (p) => p.id === c.paidById,
                )
                const isPositive = c.contribution > 0
                const isNegative = c.contribution < 0

                return (
                  <div
                    key={`${c.expenseId}-${participantId}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-100/20 dark:hover:bg-blue-900/10 transition-colors duration-150"
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        isPositive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : isNegative
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : isNegative ? (
                        <ArrowDownLeft className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {c.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatDateOnly(c.expenseDate, locale, {
                          dateStyle: 'short',
                        })}
                        {payer && payer.id !== participantId && (
                          <> · paid by {payer.name}</>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'text-xs font-semibold tabular-nums whitespace-nowrap',
                        isPositive && 'text-emerald-600 dark:text-emerald-400',
                        isNegative && 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {isPositive ? '+' : isNegative ? '-' : ''}
                      {formatCurrency(
                        currency,
                        Math.abs(c.contribution),
                        locale,
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Totals row */}
              <div className="flex items-center gap-2 px-2 py-1.5 mt-1 border-t border-blue-100/10 dark:border-blue-900/10 pt-1.5">
                <div className="flex-1 text-xs font-semibold">Total</div>
                <div
                  className={cn(
                    'text-xs font-bold tabular-nums',
                    totalFromExpenses > 0 &&
                      'text-emerald-600 dark:text-emerald-400',
                    totalFromExpenses < 0 &&
                      'text-red-600 dark:text-red-400',
                  )}
                >
                  {totalFromExpenses > 0 ? '+' : totalFromExpenses < 0 ? '-' : ''}
                  {formatCurrency(
                    currency,
                    Math.abs(totalFromExpenses),
                    locale,
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
