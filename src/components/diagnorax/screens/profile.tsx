'use client'

/* DiagnoraX AI — Profile screen (settings, privacy, data) */

import * as React from 'react'
import { useTheme } from 'next-themes'
import {
  Download,
  HeartPulse,
  LockKeyhole,
  Moon,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { api, ApiError, type HealthRecordItem } from '../api'
import { Chip, ListRow, ScreenSection, SectionTitle } from '../ui-bits'
import type { ToastTone } from '../app'

const NAME_KEY = 'diagnorax:name'

export function ProfileScreen({
  records,
  notify,
  onRefresh,
}: {
  records: HealthRecordItem[]
  notify: (message: string, tone?: ToastTone) => void
  onRefresh: () => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [name, setName] = React.useState('Friend')
  const [editOpen, setEditOpen] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState('')
  const [clearing, setClearing] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const saved = window.localStorage.getItem(NAME_KEY)
    if (saved) setName(saved)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const symptomCount = records.filter((r) => r.type === 'SYMPTOM_CHECK').length
  const bodyCount = records.filter((r) => r.type === 'BODY_ANALYSIS').length

  function saveName() {
    const trimmed = nameDraft.trim() || 'Friend'
    setName(trimmed)
    window.localStorage.setItem(NAME_KEY, trimmed)
    setEditOpen(false)
    notify('Name updated.', 'success')
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagnorax-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Export downloaded.', 'success')
  }

  async function clearAll() {
    setClearing(true)
    try {
      const res = await api.deleteAllRecords()
      notify(`Cleared ${res.deleted} record${res.deleted === 1 ? '' : 's'}.`, 'success')
      onRefresh()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not clear data.', 'error')
    } finally {
      setClearing(false)
    }
  }

  const initial = (mounted ? name : 'F').charAt(0).toUpperCase()

  return (
    <div className="flex flex-col gap-6 pt-5">
      {/* Identity card */}
      <ScreenSection>
        <div className="app-card relative overflow-hidden p-5">
          <div
            aria-hidden
            className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/8 blur-2xl"
          />
          <div className="relative flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-extrabold text-white shadow-lg shadow-emerald-600/25">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xl font-extrabold tracking-tight">{mounted ? name : '—'}</p>
                <button
                  type="button"
                  aria-label="Edit name"
                  onClick={() => {
                    setNameDraft(name)
                    setEditOpen(true)
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted active:scale-90 transition-transform"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Local profile · this device only</p>
              <div className="mt-2 flex gap-1.5">
                <Chip className="border-primary/25 bg-primary/10 text-primary">
                  <ShieldCheck className="h-3 w-3" /> Private
                </Chip>
                <Chip>v1.0</Chip>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
              { value: records.length, label: 'Total' },
              { value: symptomCount, label: 'Symptom' },
              { value: bodyCount, label: 'Body' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/70 p-3 text-center">
                <p className="text-xl font-extrabold tabular-nums leading-none">{s.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ScreenSection>

      {/* Appearance */}
      <ScreenSection>
        <SectionTitle>Appearance</SectionTitle>
        <div className="app-card divide-y divide-border/60">
          <ListRow
            icon={Moon}
            iconTone="slate"
            title="Dark mode"
            subtitle={mounted ? (isDark ? 'Easier on the eyes at night' : 'Switch to the dark theme') : 'Loading…'}
            right={
              <Switch
                checked={isDark}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
            }
          />
        </div>
      </ScreenSection>

      {/* Emergency numbers */}
      <ScreenSection>
        <SectionTitle>Emergency numbers · India</SectionTitle>
        <div className="app-card divide-y divide-border/60">
          <ListRow
            icon={Phone}
            iconTone="red"
            title="Ambulance · 108"
            subtitle="Free 24×7 emergency ambulance"
            href="tel:108"
          />
          <ListRow
            icon={Phone}
            iconTone="red"
            title="National Emergency · 112"
            subtitle="Police · Fire · Medical, all-in-one"
            href="tel:112"
          />
        </div>
      </ScreenSection>

      {/* Data & privacy */}
      <ScreenSection>
        <SectionTitle>Your data</SectionTitle>
        <div className="app-card divide-y divide-border/60">
          <ListRow
            icon={Download}
            iconTone="teal"
            title="Export all data"
            subtitle="Download every saved check as JSON"
            onClick={exportData}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-destructive/12 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-tight text-destructive">
                    Clear all data
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Permanently delete every saved check
                  </p>
                </div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100%-2.5rem)] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all {records.length} records?</AlertDialogTitle>
                <AlertDialogDescription>
                  Everything you&apos;ve checked so far will be permanently deleted from this
                  device. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2">
                <AlertDialogCancel className="mt-0 flex-1 rounded-full">Keep my data</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    void clearAll()
                  }}
                  disabled={clearing}
                  className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {clearing ? 'Clearing…' : 'Clear everything'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ListRow
            icon={LockKeyhole}
            iconTone="emerald"
            title="Private by design"
            subtitle="Records stay in this app's local database — never uploaded anywhere"
          />
        </div>
      </ScreenSection>

      {/* About */}
      <ScreenSection>
        <SectionTitle>About</SectionTitle>
        <div className="app-card flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <HeartPulse className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight">DiagnoraX AI</p>
              <p className="text-[12px] text-muted-foreground">Your Personal AI Health Companion</p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            DiagnoraX AI provides health information, not medical advice. It is not a
            substitute for professional diagnosis or treatment. In an emergency, contact
            your local emergency services immediately.
          </p>
        </div>
      </ScreenSection>

      {/* Name edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[calc(100%-2.5rem)] rounded-2xl">
          <DialogHeader>
            <DialogTitle>What should we call you?</DialogTitle>
            <DialogDescription>Saved only on this device, never sent anywhere.</DialogDescription>
          </DialogHeader>
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value.slice(0, 24))}
            placeholder="Your name"
            className="h-11 rounded-xl"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
          />
          <DialogFooter className="flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="mt-0 flex-1 rounded-full">
              Cancel
            </Button>
            <Button onClick={saveName} className="flex-1 rounded-full font-bold">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
