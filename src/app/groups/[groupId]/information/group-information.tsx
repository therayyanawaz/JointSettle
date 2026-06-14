'use client'

import { ParticipantTimeline } from '@/components/participant-timeline'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Pencil, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'
import { Button } from '@/components/ui/button'

export default function GroupInformation({ groupId }: { groupId: string }) {
  const t = useTranslations('Information')
  const { isLoading, group } = useCurrentGroup()

  return (
    <div className="space-y-4">
      {/* Group Description */}
      <div className="rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5 dark:shadow-[0_0_20px_hsl(var(--primary)_/_0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">{t('title')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('description')}</p>
            </div>
          </div>
          <Button size="sm" asChild className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-600/15">
            <Link href={`/groups/${groupId}/edit`}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="prose prose-sm sm:prose-base max-w-full whitespace-break-spaces">
          {isLoading ? (
            <div className="py-1 flex flex-col gap-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : group.information ? (
            <p className="text-foreground leading-relaxed">{group.information}</p>
          ) : (
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
          )}
        </div>
      </div>

      {/* Participant Timeline */}
      <div className="rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5 dark:shadow-[0_0_20px_hsl(var(--primary)_/_0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-700 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">Member Timeline</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              When each member joined and left the group
            </p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <ParticipantTimeline participants={group?.participants ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
