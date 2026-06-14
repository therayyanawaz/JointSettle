'use client'
import { Avatar } from '@/components/avatar'
import { BalanceDrillDown } from '@/components/balance-drill-down'
import { Balances } from '@/lib/balances'
import { Currency } from '@/lib/currency'
import { cn, formatCurrency } from '@/lib/utils'
import { Participant } from '@prisma/client'
import { useLocale } from 'next-intl'
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

type Props = {
  balances: Balances
  participants: Participant[]
  currency: Currency
  groupId: string
}

export function BalancesList({ balances, participants, currency, groupId }: Props) {
  const locale = useLocale()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const maxBalance = Math.max(
    ...Object.values(balances).map((b) => Math.abs(b.total)),
    1,
  )

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {participants.map((participant) => {
        const balance = balances[participant.id]?.total ?? 0
        const absBalance = Math.abs(balance)
        const isPositive = balance > 0
        const isNegative = balance < 0
        const isSettled = balance === 0
        const isExpanded = expandedId === participant.id

        return (
          <div
            key={participant.id}
            className={cn(
              'rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-4 transition-all duration-300 ease-out cursor-pointer',
              isExpanded
                ? 'shadow-md shadow-blue-500/12 dark:shadow-blue-600/12 border-blue-200/40 dark:border-blue-700/30'
                : 'hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/8 dark:hover:shadow-blue-600/8',
            )}
            onClick={() => toggleExpand(participant.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={participant.name}
                id={participant.id}
                size="md"
                className="ring-2 ring-background"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {participant.name}
                </div>
                <div className={cn(
                  'text-xs mt-0.5 flex items-center gap-1',
                  isSettled && 'text-muted-foreground',
                )}>
                  {isPositive && <ArrowUpCircle className="w-3 h-3 text-emerald-500" />}
                  {isNegative && <ArrowDownCircle className="w-3 h-3 text-red-500" />}
                  {isSettled && <MinusCircle className="w-3 h-3 text-muted-foreground" />}
                  <span>
                    {isSettled
                      ? 'All settled'
                      : isPositive
                        ? 'is owed'
                        : 'owes'}
                  </span>
                  {/* Expand indicator */}
                  {!isSettled && (
                    <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      details
                    </span>
                  )}
                </div>
              </div>
              <div className={cn(
                'text-right flex items-center gap-2',
                isSettled && 'text-muted-foreground',
              )}>
                <div className={cn(
                  'font-bold font-heading tabular-nums text-base',
                  isPositive && 'text-emerald-600 dark:text-emerald-400',
                  isNegative && 'text-red-600 dark:text-red-400',
                  isSettled && 'text-muted-foreground',
                )}>
                  {isPositive ? '+' : isNegative ? '-' : ''}
                  {formatCurrency(currency, absBalance, locale)}
                </div>
              </div>
            </div>

            {/* Visual balance bar */}
            {!isSettled && (
              <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-muted/30">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    isPositive
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500',
                  )}
                  style={{
                    width: `${(absBalance / maxBalance) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Drill-down section */}
            {isExpanded && !isSettled && (
              <BalanceDrillDown
                participantId={participant.id}
                participantName={participant.name}
                groupId={groupId}
                participants={participants}
                balanceTotal={balance}
                currency={currency}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
