'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/lib/hooks'
import { trpc } from '@/trpc/client'
import { UserPlus, Loader2, Check, ChevronDown, Search, SendHorizonal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useMemo } from 'react'
import { useCurrentGroup } from './current-group-context'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

export function JoinGroupButton() {
  const t = useTranslations('JoinGroup')
  const { groupId, group } = useCurrentGroup()
  const { hash } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'custom'>('select')
  const [requestSent, setRequestSent] = useState(false)
  const [error, setError] = useState('')
  const utils = trpc.useUtils()

  const { mutateAsync: requestJoin, isPending } = trpc.groups.joinRequests.request.useMutation()

  if (!group) return null

  // Only show participants who haven't left — these are "claimable" by new joiners
  const availableParticipants = useMemo(
    () => group.participants.filter((p) => !p.leftAt),
    [group.participants],
  )

  const handleSelectParticipant = async (participantId: string) => {
    localStorage.setItem(`${groupId}-activeUser`, participantId)
    await utils.groups.invalidate()
    setOpen(false)
    setSelectedParticipantId(null)
    setMode('select')
  }

  const handleSubmitNewName = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    try {
      await requestJoin({
        groupId,
        hash: hash!,
        name: name.trim(),
      })
      setRequestSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit join request')
    }
  }

  const trigger = (
    <Button size="sm" className="bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-600/15">
      <UserPlus className="w-4 h-4 mr-1.5" />
      {t('join')}
    </Button>
  )

  const form = (
    <div className="space-y-5">
      {/* Request Sent */}
      {requestSent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
            <SendHorizonal className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t('requestSentTitle')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('requestSentDescription')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setOpen(false); setRequestSent(false); setMode('select') }} className="mt-2">
            {t('close')}
          </Button>
        </div>
      ) : mode === 'select' ? (
        <>
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t('selectLabel')}
            </p>
            {availableParticipants.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableParticipants.map((participant) => {
                  const isSelected = selectedParticipantId === participant.id
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => {
                        setSelectedParticipantId(participant.id)
                        handleSelectParticipant(participant.id)
                      }}
                      className={cn(
                        'relative flex items-center gap-2 rounded-xl border p-3 transition-all duration-200 cursor-pointer text-left',
                        isSelected
                          ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                          : 'border-blue-100/30 dark:border-blue-900/20 bg-white/40 dark:bg-white/[0.03] hover:border-emerald-300/40 dark:hover:border-emerald-700/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20',
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                        isSelected
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                          : 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                      )}>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate">{participant.name}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noAvailableParticipants')}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setMode('custom')}
              className="w-full border-dashed border-blue-200/50 dark:border-blue-800/30 text-muted-foreground hover:text-foreground"
            >
              <Search className="w-4 h-4 mr-2" />
              {t('customNameOption')}
            </Button>
          </div>
        </>
      ) : null}

      {/* Step 2: Type a custom name */}
      {mode === 'custom' && (
        <form onSubmit={handleSubmitNewName} className="space-y-4">
          <button
            type="button"
            onClick={() => { setMode('select'); setError('') }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors mb-1"
          >
            <ChevronDown className="w-3 h-3 rotate-90" />
            {t('backToSelect')}
          </button>

          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('nameLabel')}</label>
            <Input
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              className="text-base"
              autoFocus
              maxLength={50}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500" disabled={isPending}>
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('joining')}</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> {t('join')}</>
            )}
          </Button>
        </form>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[420px] animate-scale-in">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description', { groupName: group.name })}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description', { groupName: group.name })}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{form}</div>
        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  )
}
