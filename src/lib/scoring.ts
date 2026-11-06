import { POINTS_PER_QUESTION, PASS_AVERAGE } from '../data/constants'
import type {
  ExamResult,
  Question,
  SubjectScore,
  UserAnswers,
} from '../data/types'

export function scoreExam(
  questions: Question[],
  answers: UserAnswers,
): ExamResult {
  const questionResults = questions.map((question) => {
    const userAnswer = answers[question.id] ?? null
    const accepted =
      question.acceptedAnswers && question.acceptedAnswers.length > 0
        ? question.acceptedAnswers
        : question.answer
          ? [question.answer]
          : []
    const isCorrect =
      userAnswer !== null && accepted.includes(userAnswer)
    return { question, userAnswer, isCorrect }
  })

  const groupKey = (q: Question) => `${q.year}-${q.subject}`
  const groups = new Map<string, Question[]>()

  for (const question of questions) {
    const key = groupKey(question)
    const existing = groups.get(key) ?? []
    existing.push(question)
    groups.set(key, existing)
  }

  const subjectScores: SubjectScore[] = [...groups.entries()]
    .map(([key, groupQuestions]) => {
      const [yearStr, subject] = key.split('-')
      const correctCount = groupQuestions.filter((q) => {
        const userAnswer = answers[q.id]
        if (!userAnswer) return false
        const accepted =
          q.acceptedAnswers && q.acceptedAnswers.length > 0
            ? q.acceptedAnswers
            : [q.answer]
        return accepted.includes(userAnswer)
      }).length
      const totalCount = groupQuestions.length
      const score = correctCount * POINTS_PER_QUESTION
      const maxScore = totalCount * POINTS_PER_QUESTION

      return {
        subject: subject as SubjectScore['subject'],
        year: Number(yearStr),
        correctCount,
        totalCount,
        score,
        maxScore,
      }
    })
    .sort((a, b) => a.year - b.year || a.subject.localeCompare(b.subject))

  const average =
    subjectScores.length === 0
      ? 0
      : subjectScores.reduce((sum, s) => sum + s.score, 0) / subjectScores.length

  const passed =
    average >= PASS_AVERAGE && subjectScores.every((s) => s.score > 0)

  return {
    subjectScores,
    average,
    passed,
    questionResults,
  }
}
