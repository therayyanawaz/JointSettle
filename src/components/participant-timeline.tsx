'use client'

import { Avatar } from '@/components/avatar'
import { cn } from '@/lib/utils'
import { useLocale } from 'next-intl'
import dayjs from 'dayjs'

type ParticipantTimelineEntry = {
  id: string
  name: string
  joinedAt: Date | string
  leftAt?: Date | string | null
}

type Props = {
  participants: ParticipantTimelineEntry[]
  /** Optional reference date for computing "today" in the timeline */
  now?: Date
}

export function ParticipantTimeline({
  participants,
  now,
}: Props) {
  const locale = useLocale()
  const today = now ? dayjs(now) : dayjs()

  // Sort participants by joinedAt ascending
  const sorted = [...participants].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
  )

  // Find the overall date range for the timeline scale
  const allDates = sorted.flatMap((p) => {
    const dates = [new Date(p.joinedAt).getTime()]
    if (p.leftAt) dates.push(new Date(p.leftAt).getTime())
    dates.push(today.valueOf())
    return dates
  })
  const minTime = Math.min(...allDates)
  const maxTime = Math.max(...allDates, today.valueOf())
  const range = maxTime - minTime || 1

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No participants yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((participant) => {
        const joined = dayjs(participant.joinedAt)
        const left = participant.leftAt ? dayjs(participant.leftAt) : null
        const isActive = !left || left.isAfter(today)

        // Calculate bar position and width as percentages of the timeline
        const startPct =
          ((joined.valueOf() - minTime) / range) * 100
        const endTime = left
          ? left.valueOf()
          : today.valueOf()
        const widthPct =
          ((endTime - joined.valueOf()) / range) * 100

        const joinedFormatted = joined.format('MMM D, YYYY')
        const leftFormatted = left ? left.format('MMM D, YYYY') : null
        const durationDays = left
          ? left.diff(joined, 'day')
          : today.diff(joined, 'day')

        return (
          <div
            key={participant.id}
            className="flex items-center gap-3 group"
          >
            {/* Participant avatar + name */}
            <div className="flex items-center gap-2 w-28 shrink-0">
              <Avatar
                name={participant.name}
                id={participant.id}
                size="sm"
                className="ring-2 ring-background"
              />
              <span className="text-xs font-medium truncate">
                {participant.name}
              </span>
            </div>

            {/* Timeline bar */}
            <div className="flex-1 relative h-8 flex items-center">
              {/* Background track */}
              <div className="absolute inset-x-0 h-2 rounded-full bg-muted/40" />

              {/* Active period bar */}
              <div
                className={cn(
                  'absolute h-2 rounded-full transition-all duration-500',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500'
                    : 'bg-gradient-to-r from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500',
                )}
                style={{
                  left: `${Math.max(0, startPct)}%`,
                  width: `${Math.max(2, widthPct)}%`,
                }}
              >
                {/* Start marker */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-400" />
                {/* End marker (if left) */}
                {left && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-500" />
                )}
              </div>

              {/* Date labels */}
              <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-[10px] text-muted-foreground">
                <span>{joinedFormatted}</span>
                {leftFormatted && <span>{leftFormatted}</span>}
                {isActive && (
                  <span className="text-blue-500 dark:text-blue-400 font-medium">
                    Present
                  </span>
                )}
              </div>
            </div>

            {/* Duration badge */}
            <div className="w-14 text-right shrink-0">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {durationDays}d
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
