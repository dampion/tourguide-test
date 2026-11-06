import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SUBJECT_LABELS, SUBJECT_ORDER } from '../data/constants'
import type { AnswerKey, ExamConfig, Question, UserAnswers } from '../data/types'
import { loadQuestions } from '../lib/examLoader'

function storageKey(config: ExamConfig): string {
  return `exam-draft:${config.year}:${config.subjects.join(',')}`
}

export default function Exam() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state?.config as ExamConfig | undefined

  const questions = useMemo(
    () => (config ? loadQuestions(config) : []),
    [config],
  )

  const [answers, setAnswers] = useState<UserAnswers>({})
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!config) {
      navigate('/setup', { replace: true })
      return
    }

    const saved = localStorage.getItem(storageKey(config))
    if (saved) {
      try {
        setAnswers(JSON.parse(saved) as UserAnswers)
      } catch {
        localStorage.removeItem(storageKey(config))
      }
    }
  }, [config, navigate])

  useEffect(() => {
    if (!config) return
    localStorage.setItem(storageKey(config), JSON.stringify(answers))
  }, [answers, config])

  if (!config || questions.length === 0) {
    return null
  }

  const answeredCount = questions.filter((q) => answers[q.id]).length
  const unansweredCount = questions.length - answeredCount

  const grouped = SUBJECT_ORDER.flatMap((subject) => {
    const subjectQuestions = questions.filter((q) => q.subject === subject)
    if (subjectQuestions.length === 0) return []

    const years = [...new Set(subjectQuestions.map((q) => q.year))].sort()
    return years.map((year) => ({
      subject,
      year,
      questions: subjectQuestions.filter((q) => q.year === year),
    }))
  })

  const selectAnswer = (questionId: string, key: AnswerKey) => {
    setAnswers((current) => ({ ...current, [questionId]: key }))
  }

  const submit = () => {
    if (unansweredCount > 0) {
      setShowWarning(true)
      return
    }
    finishSubmit()
  }

  const finishSubmit = () => {
    localStorage.removeItem(storageKey(config))
    navigate('/result', { state: { config, answers, questions } })
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 pb-28">
      <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">作答中</h1>
            <p className="text-sm text-slate-600">
              已答 {answeredCount} / {questions.length} 題
            </p>
          </div>
          <Link to="/setup" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            重新設定
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {questions.map((q) => {
            const answered = Boolean(answers[q.id])
            return (
              <a
                key={q.id}
                href={`#${q.id}`}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  answered
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200'
                }`}
              >
                {q.year}-{q.number}
              </a>
            )
          })}
        </div>
      </div>

      <div className="mt-8 space-y-10">
        {grouped.map(({ subject, year, questions: sectionQuestions }) => (
          <section key={`${year}-${subject}`}>
            <h2 className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900">
              {year} 年 · {SUBJECT_LABELS[subject]}
            </h2>
            <div className="mt-4 space-y-8">
              {sectionQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  selected={answers[question.id] ?? null}
                  onSelect={(key) => selectAnswer(question.id, key)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {unansweredCount > 0 ? `尚有 ${unansweredCount} 題未作答` : '全部題目已作答'}
          </p>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
          >
            送出答案
          </button>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">尚有未作答題目</h3>
            <p className="mt-2 text-slate-600">
              還有 {unansweredCount} 題未作答。未作答題目將以 0 分計算，確定要送出嗎？
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                繼續作答
              </button>
              <button
                type="button"
                onClick={finishSubmit}
                className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
              >
                確定送出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: Question
  selected: AnswerKey | null
  onSelect: (key: AnswerKey) => void
}) {
  return (
    <article id={question.id} className="scroll-mt-36 rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-base font-medium text-slate-500">第 {question.number} 題</p>
      <p className="mt-2 text-lg leading-relaxed text-slate-900">{question.text}</p>
      <div className="mt-4 space-y-2">
        {question.options.map((option) => (
          <label
            key={option.key}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${
              selected === option.key
                ? 'border-teal-500 bg-teal-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name={question.id}
              checked={selected === option.key}
              onChange={() => onSelect(option.key)}
              className="mt-1 size-4 border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-base text-slate-800">
              <span className="font-semibold">{option.key}.</span> {option.text}
            </span>
          </label>
        ))}
      </div>
    </article>
  )
}
