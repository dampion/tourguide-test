import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AVAILABLE_YEARS,
  SUBJECT_LABELS,
  SUBJECT_ORDER,
} from '../data/constants'
import type { ExamConfig, Subject, YearSelection } from '../data/types'
import { countQuestions } from '../lib/examLoader'

const defaultSubjects: Subject[] = [...SUBJECT_ORDER]

export default function Setup() {
  const navigate = useNavigate()
  const [year, setYear] = useState<YearSelection>(114)
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects)

  const config: ExamConfig = useMemo(() => ({ year, subjects }), [year, subjects])
  const questionCount = useMemo(() => countQuestions(config), [config])

  const toggleSubject = (subject: Subject) => {
    setSubjects((current) => {
      if (current.includes(subject)) {
        return current.filter((item) => item !== subject)
      }
      return [...current, subject].sort(
        (a, b) => SUBJECT_ORDER.indexOf(a) - SUBJECT_ORDER.indexOf(b),
      )
    })
  }

  const startExam = () => {
    if (subjects.length === 0 || questionCount === 0) return
    navigate('/exam', { state: { config } })
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link to="/" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        ← 返回首頁
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">測驗設定</h1>
        <p className="mt-2 text-slate-600">選擇年度與科目後開始作答。</p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">選擇年度</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {AVAILABLE_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`rounded-lg border px-4 py-2 text-base font-medium transition ${
                  year === y
                    ? 'border-teal-600 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {y} 年
              </button>
            ))}
            <button
              type="button"
              onClick={() => setYear('all')}
              className={`rounded-lg border px-4 py-2 text-base font-medium transition ${
                year === 'all'
                  ? 'border-teal-600 bg-teal-50 text-teal-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              綜合所有年份
            </button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">選擇科目</h2>
          <div className="mt-3 space-y-3">
            {SUBJECT_ORDER.map((subject) => (
              <label
                key={subject}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={subjects.includes(subject)}
                  onChange={() => toggleSubject(subject)}
                  className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-base text-slate-800">{SUBJECT_LABELS[subject]}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="mt-8 rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
          共 <strong>{questionCount}</strong> 題
          {year === 'all' && subjects.length === SUBJECT_ORDER.length
            ? `（${AVAILABLE_YEARS.length} 年 × 三科）`
            : null}
        </div>

        <button
          type="button"
          onClick={startExam}
          disabled={subjects.length === 0 || questionCount === 0}
          className="mt-6 w-full rounded-xl bg-teal-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          開始作答
        </button>
      </div>
    </div>
  )
}
