'use client'

import { LeaveGroupButton } from '@/app/groups/[groupId]/leave-group-button'
import { GroupForm } from '@/components/group-form'
import { trpc } from '@/trpc/client'
import { useAuth } from '@/components/auth-provider'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  CheckCircle,
  LogOut,
  Settings,
  Trash2,
  XCircle,
  UserMinus,
  UserPlus,
  Loader2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCurrentGroup } from '../current-group-context'
import { useState } from 'react'

export const EditGroup = () => {
  const { groupId, isOwner } = useCurrentGroup()
  const { hash } = useAuth()
  const t = useTranslations('Settings')
  const dt = useTranslations('DeleteGroup')
  const lt = useTranslations('LeaveGroup')
  const jt = useTranslations('JoinRequests')
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId, hash: hash! })
  const { mutateAsync: updateGroup } = trpc.groups.update.useMutation()
  const { mutateAsync: deleteGroup, isPending: isDeleting } = trpc.groups.delete.useMutation()

  // Leave requests query (admin only)
  const { data: leaveRequestsData, isLoading: leaveRequestsLoading, refetch: refetchRequests } =
    trpc.groups.leave.listRequests.useQuery(
      { groupId, hash: hash! },
      { enabled: isOwner },
    )
  const { mutateAsync: approveRequest, isPending: isApproving } =
    trpc.groups.leave.approve.useMutation()
  const { mutateAsync: rejectRequest, isPending: isRejecting } =
    trpc.groups.leave.reject.useMutation()

  // Join requests query (admin only)
  const { data: joinRequestsData, isLoading: joinRequestsLoading, refetch: refetchJoinRequests } =
    trpc.groups.joinRequests.listRequests.useQuery(
      { groupId, hash: hash! },
      { enabled: isOwner },
    )
  const { mutateAsync: approveJoinRequest, isPending: isApprovingJoin } =
    trpc.groups.joinRequests.approve.useMutation()
  const { mutateAsync: rejectJoinRequest, isPending: isRejectingJoin } =
    trpc.groups.joinRequests.reject.useMutation()

  const utils = trpc.useUtils()
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (isLoading) return <></>

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup({ groupId, hash: hash! })
      toast({ description: dt('toastSuccess') })
      await utils.groups.invalidate()
      router.push('/groups')
    } catch (err: any) {
      toast({
        description: err.message || dt('toastError'),
        variant: 'destructive',
      })
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest({ groupId, hash: hash!, requestId })
      toast({ description: lt('approveSuccess') })
      await refetchRequests()
      await utils.groups.invalidate()
    } catch (err: any) {
      toast({ description: err.message || lt('approveError'), variant: 'destructive' })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest({ groupId, hash: hash!, requestId })
      toast({ description: lt('rejectSuccess') })
      await refetchRequests()
    } catch (err: any) {
      toast({ description: err.message || lt('rejectError'), variant: 'destructive' })
    }
  }

  const handleApproveJoin = async (requestId: string) => {
    try {
      await approveJoinRequest({ groupId, hash: hash!, requestId })
      toast({ description: jt('approveSuccess') })
      await refetchJoinRequests()
      await utils.groups.invalidate()
    } catch (err: any) {
      toast({ description: err.message || jt('approveError'), variant: 'destructive' })
    }
  }

  const handleRejectJoin = async (requestId: string) => {
    try {
      await rejectJoinRequest({ groupId, hash: hash!, requestId })
      toast({ description: jt('rejectSuccess') })
      await refetchJoinRequests()
    } catch (err: any) {
      toast({ description: err.message || jt('rejectError'), variant: 'destructive' })
    }
  }

  const pendingRequests = leaveRequestsData?.requests.filter(
    (r: any) => r.status === 'pending'
  ) ?? []
  const resolvedRequests = leaveRequestsData?.requests.filter(
    (r: any) => r.status !== 'pending'
  ) ?? []
  const pendingJoinRequests = joinRequestsData?.requests.filter(
    (r: any) => r.status === 'pending'
  ) ?? []

  return (
    <>
      <div className="rounded-xl border border-blue-100/20 dark:border-blue-900/15 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5 mb-4 dark:shadow-[0_0_20px_hsl(var(--primary)_/_0.06)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">{t('title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage group settings and participants</p>
          </div>
        </div>
      </div>
      <GroupForm
        group={data?.group}
        onSubmit={async (groupFormValues, participantId) => {
          await updateGroup({ groupId, hash: hash!, participantId, groupFormValues })
          await utils.groups.invalidate()
        }}
        protectedParticipantIds={data?.participantsWithExpenses}
      />

      {/* Leave Requests — Admin Only */}
      {isOwner && (
        <div className="mt-8 rounded-xl border border-amber-200/30 dark:border-amber-900/20 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <UserMinus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-amber-700 dark:text-amber-400">{lt('requestsTitle')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{lt('requestsDescription')}</p>
            </div>
          </div>

          {leaveRequestsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading requests...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>{lt('noPendingRequests')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/30 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={request.participant.name}
                      id={request.participant.id}
                      size="sm"
                      className="ring-2 ring-background shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {request.participant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lt('wantsToLeave')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={isApproving || isRejecting}
                      className="border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                    >
                      {isApproving ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {lt('approve')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                      disabled={isApproving || isRejecting}
                      className="border-red-200/50 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30"
                    >
                      {isRejecting ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {lt('reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolved requests history */}
          {resolvedRequests.length > 0 && (
            <details className="mt-4 group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                {lt('resolvedHistory', { count: resolvedRequests.length })}
              </summary>
              <div className="mt-2 space-y-1.5">
                {resolvedRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1"
                  >
                    <span className="font-medium">{request.participant.name}</span>
                    <span>
                      {request.status === 'approved'
                        ? lt('wasApproved')
                        : lt('wasRejected')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Join Requests — Admin Only */}
      {isOwner && (
        <div className="mt-8 rounded-xl border border-blue-200/30 dark:border-blue-900/20 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-blue-700 dark:text-blue-400">{jt('requestsTitle')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{jt('requestsDescription')}</p>
            </div>
          </div>

          {joinRequestsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading requests...
            </div>
          ) : pendingJoinRequests.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>{jt('noPendingRequests')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingJoinRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-blue-200/30 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-950/10 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {request.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {jt('wantsToJoin')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveJoin(request.id)}
                      disabled={isApprovingJoin || isRejectingJoin}
                      className="border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                    >
                      {isApprovingJoin ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {jt('approve')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectJoin(request.id)}
                      disabled={isApprovingJoin || isRejectingJoin}
                      className="border-red-200/50 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30"
                    >
                      {isRejectingJoin ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {jt('reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 rounded-xl border border-red-200/30 dark:border-red-900/20 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-red-700 dark:text-red-400">{lt('sectionTitle')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{lt('sectionDescription')}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {lt('sectionHelp')}
        </p>
        <LeaveGroupButton />
      </div>

      {/* Delete Group — Admin Only */}
      {isOwner && (
        <div className="mt-6 rounded-xl border border-red-300/40 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-900/50 dark:to-rose-900/50 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-red-700 dark:text-red-400">{dt('title')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{dt('subtitle')}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {dt('description')}
          </p>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-500">
                <Trash2 className="w-4 h-4 mr-1.5" />
                {dt('button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] animate-scale-in">
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                {dt('confirmTitle')}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {dt('confirmDescription')}
              </DialogDescription>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                  {dt('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteGroup}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-500"
                >
                  {isDeleting ? dt('deleting') : dt('confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  )
}
