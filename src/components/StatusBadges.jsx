import { useLang } from '../context/LangContext'
import {
  getRequestStatus,
  getRequestStatusLabelForLang,
  getRequestStatusMeta,
  getRequestStatusStep,
  isRequestTerminal
} from '../lib/requestStatus'

const toneStyles = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-sky-100 text-sky-700 ring-sky-200',
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-100 text-rose-700 ring-rose-200'
}

const dotStyles = {
  slate: 'bg-slate-500',
  blue: 'bg-sky-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500'
}

function StepDot({ active, done, tone }) {
  if (active) return <span className={`h-2.5 w-2.5 rounded-full ${dotStyles[tone] || dotStyles.slate}`} />
  if (done) return <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
  return <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
}

export default function StatusBadges({ item, variant = 'compact' }) {
  const { lang } = useLang()
  const status = getRequestStatus(item)
  const meta = getRequestStatusMeta(status)
  const step = getRequestStatusStep(status)
  const toneClass = toneStyles[meta.tone] || toneStyles.slate
  const terminal = isRequestTerminal(status)
  const timeline = [
    { key: 'pending', labelFr: 'En attente', labelEn: 'Pending' },
    { key: 'paid', labelFr: 'Payé', labelEn: 'Paid' },
    { key: 'in_progress', labelFr: 'En cours', labelEn: 'In progress' },
    {
      key: 'final',
      labelFr: terminal ? meta.labelFr : 'Final',
      labelEn: terminal ? meta.labelEn : 'Final',
      final: true
    }
  ]

  return (
    <div className={variant === 'full' ? 'space-y-2' : 'inline-flex flex-col gap-1'}>
      <span className={`badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
        {getRequestStatusLabelForLang(status, lang)}
      </span>
      {variant === 'full' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span>Step {step}/4</span>
            {terminal && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                Final
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {timeline.map((stage) => {
              const active = stage.key === status || (stage.final && step === 4)
              const done =
                stage.key === 'pending' ||
                stage.key === 'paid' ||
                stage.key === 'in_progress'
                  ? getRequestStatusStep(stage.key) < step
                  : terminal && active
              return (
                <div
                  key={stage.key}
                  className={`rounded-xl border px-2 py-2 text-center text-[10px] font-semibold transition ${
                    active
                      ? 'border-oasis-blue bg-oasis-blue text-white shadow-sm'
                      : done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="mx-auto mb-1 flex w-fit items-center gap-1">
                    <StepDot
                      active={active}
                      done={done}
                      tone={stage.key === 'final' ? (terminal ? meta.tone : 'slate') : getRequestStatusMeta(stage.key).tone}
                    />
                    <span>{lang === 'en' ? stage.labelEn : stage.labelFr}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
