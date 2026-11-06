import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PASS_AVERAGE, SUBJECT_LABELS } from '../data/constants'
import type { ExamConfig, Question, UserAnswers } from '../data/types'
import { scoreExam } from '../lib/scoring'

export default function Result() {
  const location = useLocation()
  const navigate = useNavigate()

  const config = location.state?.config as ExamConfig | undefined
  const answers = location.state?.answers as UserAnswers | undefined
  const questions = location.state?.questions as Question[] | undefined

  const result = useMemo(() => {
    if (!questions || !answers) return null
    return scoreExam(questions, answers)
  }, [questions, answers])

  useEffect(() => {
    if (!config || !answers || !questions) {
      navigate('/setup', { replace: true })
    }
  }, [config, answers, questions, navigate])

  if (!config || !answers || !questions || !result) {
    return null
  }

  const groupedResults = result.questionResults.reduce<
    Record<string, typeof result.questionResults>
  >((acc, item) => {
    const key = `${item.question.year}-${item.question.subject}`
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">測驗結果</p>
        <h1
          className={`mt-2 text-3xl font-bold ${
            result.passed ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {result.passed ? '及格' : '不及格'}
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          三科平均 {result.average.toFixed(1)} 分（及格標準 {PASS_AVERAGE} 分）
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.subjectScores.map((subjectScore) => (
            <div
              key={`${subjectScore.year}-${subjectScore.subject}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm text-slate-500">{subjectScore.year} 年</p>
              <p className="font-semibold text-slate-900">
                {SUBJECT_LABELS[subjectScore.subject]}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {subjectScore.score}
                <span className="text-base font-normal text-slate-500">
                  {' '}
                  / {subjectScore.maxScore}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                答對 {subjectScore.correctCount} / {subjectScore.totalCount} 題
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/setup"
            className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
          >
            再練一次
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            返回首頁
          </Link>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <h2 className="text-xl font-bold text-slate-900">逐題詳解</h2>
        {Object.entries(groupedResults).map(([key, items]) => {
          const [year, subject] = key.split('-')
          return (
            <section key={key}>
              <h3 className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900">
                {year} 年 · {SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS]}
              </h3>
              <div className="mt-4 space-y-4">
                {items.map(({ question, userAnswer, isCorrect }) => (
                  <div
                    key={question.id}
                    className={`rounded-xl border p-4 ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-rose-200 bg-rose-50/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">第 {question.number} 題</p>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? '答對' : '答錯'}
                      </span>
                    </div>
                    <p className="mt-2 text-base text-slate-800">{question.text}</p>
                    <div className="mt-3 grid gap-1 text-sm text-slate-700">
                      <p>
                        你的答案：
                        <strong className="ml-1">{userAnswer ?? '未作答'}</strong>
                      </p>
                      <p>
                        正確答案：
                        <strong className="ml-1">
                          {question.acceptedAnswers && question.acceptedAnswers.length > 1
                            ? question.acceptedAnswers.join(' / ')
                            : question.answer}
                        </strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
