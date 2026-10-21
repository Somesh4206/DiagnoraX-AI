'use client'

/* DiagnoraX AI — Profile screen (fresh rebuild):
 * display name, AI engine status + optional cloud server, emergency numbers,
 * data export, clear-all and about. */

import { useEffect, useState } from 'react'
import {
  Check,
  Cloud,
  Cpu,
  Download,
  Globe,
  HeartPulse,
  Info,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api, currentAiMode, getRemoteServer, setRemoteServer } from '../api'
import { useApp } from '../app'
import { MEDICAL_DISCLAIMER, SectionTitle } from '../ui'

const NAME_KEY = 'diagnorax.name'

export function ProfileScreen() {
  const { records, refreshRecords, aiMode, recheckAiMode } = useApp()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const [remoteDraft, setRemoteDraft] = useState('')
  const [remoteSet, setRemoteSet] = useState('')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    setName(window.localStorage.getItem(NAME_KEY) ?? '')
    const current = getRemoteServer()
    setRemoteSet(current)
    setRemoteDraft(current)
  }, [])

  function saveName() {
    const trimmed = draft.trim().slice(0, 40)
    if (trimmed) {
      window.localStorage.setItem(NAME_KEY, trimmed)
      setName(trimmed)
      toast({ title: 'Name saved', description: 'The Home screen will greet you personally.' })
    }
    setEditing(false)
  }

  function exportData() {
    const payload = {
      app: 'DiagnoraX AI',
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagnorax-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Export ready', description: 'Your data was downloaded as JSON.' })
  }

  async function clearAll() {
    setClearing(true)
    try {
      const res = await api.clearAllRecords()
      await refreshRecords()
      toast({ title: 'All data cleared', description: `${res.deleted} record(s) deleted.` })
      setClearOpen(false)
    } catch {
      toast({ title: 'Could not clear data', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setClearing(false)
    }
  }

  async function saveRemote() {
    const trimmed = remoteDraft.trim().replace(/\/+$/, '')
    if (trimmed && !/^https?:\/\//.test(trimmed)) {
      toast({
        title: 'Invalid server URL',
        description: 'It must start with http:// or https://',
        variant: 'destructive',
      })
      return
    }
    setConnecting(true)
    setRemoteServer(trimmed)
    await recheckAiMode() // fresh probe through the new configuration
    const mode = await currentAiMode() // reads the cached answer
    await refreshRecords()
    setConnecting(false)
    setRemoteSet(trimmed)
    if (trimmed) {
      if (mode === 'cloud') {
        toast({
          title: 'Cloud AI connected',
          description: 'Symptom checks now use your server.',
        })
      } else {
        toast({
          title: 'Could not reach that server',
          description: 'Still running the on-device engine.',
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Server cleared',
        description: 'The built-in backend is used whenever it is reachable.',
      })
    }
  }

  async function disconnectRemote() {
    setRemoteServer('')
    setRemoteDraft('')
    setRemoteSet('')
    await recheckAiMode()
    await refreshRecords()
    toast({ title: 'Cloud server disconnected', description: 'Back to the on-device engine.' })
  }

  const symptomCount = records.filter((r) => r.type === 'SYMPTOM_CHECK').length
  const bodyCount = records.filter((r) => r.type === 'BODY_ANALYSIS').length

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-5">
      {/* header + identity */}
      <section className="neon-card flex items-center gap-4 rounded-2xl p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-neon/40 bg-neon/10 shadow-[0_0_18px_rgba(0,255,163,.2)]">
          <User className="size-6 text-neon" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 40))}
                placeholder="Your name"
                aria-label="Your name"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-secondary/60 px-3 text-[14px] outline-none placeholder:text-text-3 focus:border-neon/50"
              />
              <button
                onClick={saveName}
                aria-label="Save name"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neon text-primary-foreground"
              >
                <Check className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDraft(name)
                setEditing(true)
              }}
              className="flex items-center gap-2 text-left"
            >
              <p className="truncate text-[17px] font-bold tracking-tight">
                {name || 'Add your name'}
              </p>
              <Pencil className="size-3.5 shrink-0 text-text-3" aria-hidden />
            </button>
          )}
          <p className="mt-1 text-[11.5px] text-text-3">
            {symptomCount} symptom check{symptomCount === 1 ? '' : 's'} · {bodyCount} body
            analysis{bodyCount === 1 ? '' : 'es'}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-text-3">
            <ShieldCheck className="size-3 text-neon/70" aria-hidden /> Stored on this device only
          </p>
        </div>
      </section>

      {/* AI engine */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={Cpu}>AI engine</SectionTitle>
        <div className="neon-card flex flex-col gap-3.5 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span
              className={
                'flex size-9 shrink-0 items-center justify-center rounded-xl border ' +
                (aiMode === 'cloud'
                  ? 'border-neon/30 bg-neon/10'
                  : 'border-warn/30 bg-warn/10')
              }
            >
              {aiMode === 'cloud' ? (
                <Cloud className="size-4 text-neon" aria-hidden />
              ) : (
                <Cpu className="size-4 text-warn" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold">
                {aiMode === 'cloud' ? 'Cloud AI · connected' : 'On-device engine · offline'}
              </p>
              <p className="text-[11px] leading-snug text-text-3">
                {aiMode === 'cloud'
                  ? remoteSet
                    ? `Using your server: ${remoteSet}`
                    : 'Large language model analysis via this app\u2019s server.'
                  : 'Emergency triage + pre-written guidance, computed entirely on this phone.'}
              </p>
            </div>
          </div>

          {aiMode === 'offline' ? (
            <div className="flex flex-col gap-2.5 border-t border-border/60 pt-3.5">
              <Label htmlFor="remote-server">Connect a cloud AI server (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="remote-server"
                  value={remoteDraft}
                  onChange={(e) => setRemoteDraft(e.target.value)}
                  placeholder="https://your-diagnorax.vercel.app"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="border-input bg-secondary/60"
                />
                <Button
                  onClick={() => void saveRemote()}
                  disabled={connecting || remoteDraft.trim() === remoteSet}
                  className="h-10 shrink-0 rounded-xl bg-neon px-4 text-primary-foreground hover:bg-neon-dim"
                >
                  {connecting ? 'Connecting…' : 'Connect'}
                </Button>
              </div>
              <p className="text-[10.5px] leading-relaxed text-text-3">
                Deploy this project anywhere (Vercel, Render, your own server) and paste its URL
                here — the app will use its AI backend over the network. Everything else keeps
                working offline.
              </p>
            </div>
          ) : remoteSet ? (
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3.5">
              <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-text-2">
                <Globe className="size-3.5 shrink-0 text-cyan" aria-hidden />
                <span className="truncate">{remoteSet}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => void disconnectRemote()}
                className="h-8 shrink-0 rounded-lg border-border px-2.5 text-[11px]"
              >
                <X className="size-3" aria-hidden /> Disconnect
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {/* emergency numbers */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={Phone}>Emergency numbers (India)</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:112"
            className="neon-card neon-card-hover flex flex-col gap-1 rounded-2xl border-danger/30 p-4"
          >
            <span className="flex items-center gap-2 text-lg font-bold text-danger">
              <Phone className="size-4" aria-hidden /> 112
            </span>
            <span className="text-[10.5px] leading-snug text-text-3">
              National emergency number
            </span>
          </a>
          <a
            href="tel:108"
            className="neon-card neon-card-hover flex flex-col gap-1 rounded-2xl border-warn/30 p-4"
          >
            <span className="flex items-center gap-2 text-lg font-bold text-warn">
              <HeartPulse className="size-4" aria-hidden /> 108
            </span>
            <span className="text-[10.5px] leading-snug text-text-3">Ambulance service</span>
          </a>
        </div>
      </section>

      {/* your data */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={Download}>Your data</SectionTitle>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={exportData}
            disabled={records.length === 0}
            className="neon-card neon-card-hover flex items-center gap-3 rounded-2xl p-4 text-left disabled:opacity-40"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10">
              <Download className="size-4 text-cyan" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-[13.5px] font-semibold">Export as JSON</span>
              <span className="block text-[11px] text-text-3">
                Download everything the app has saved
              </span>
            </span>
          </button>

          <button
            onClick={() => setClearOpen(true)}
            disabled={records.length === 0}
            className="neon-card neon-card-hover flex items-center gap-3 rounded-2xl border-danger/25 p-4 text-left disabled:opacity-40"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/10">
              <Trash2 className="size-4 text-danger" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-[13.5px] font-semibold text-danger">
                Clear all data
              </span>
              <span className="block text-[11px] text-text-3">
                Permanently delete every saved record
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* about */}
      <section className="flex flex-col gap-3">
        <SectionTitle icon={Info}>About</SectionTitle>
        <div className="neon-card flex flex-col gap-2.5 rounded-2xl p-4 text-[12px] leading-relaxed text-text-2">
          <p>
            <span className="font-semibold text-foreground">DiagnoraX AI</span> · v2.1 · Android
            APK + web edition
          </p>
          <p>
            Cloud mode analyses run on a large language model with a deterministic emergency
            triage layer. Offline mode (APK) runs the same triage plus a pre-written on-device
            knowledge base. Body analysis is pure arithmetic — no AI involved.
          </p>
          <p className="text-[10.5px] text-text-3">{MEDICAL_DISCLAIMER}</p>
        </div>
      </section>

      {/* clear-all confirmation */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="max-w-[340px] border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all records?</AlertDialogTitle>
            <AlertDialogDescription>
              All {records.length} record(s) will be permanently removed from this device. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1 border-border bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void clearAll()
              }}
              disabled={clearing}
              className="flex-1 bg-danger text-destructive-foreground hover:bg-danger/85"
            >
              {clearing ? 'Clearing…' : 'Delete all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
