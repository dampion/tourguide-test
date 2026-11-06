import { AVAILABLE_YEARS, SUBJECT_ORDER } from '../data/constants'
import { getAllExamSets } from '../data/registry'
import type { ExamConfig, Question, Subject } from '../data/types'

function sortQuestions(questions: Question[]): Question[] {
  const subjectIndex = (subject: Subject) => SUBJECT_ORDER.indexOf(subject)

  return [...questions].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    const subjectDiff = subjectIndex(a.subject) - subjectIndex(b.subject)
    if (subjectDiff !== 0) return subjectDiff
    return a.number - b.number
  })
}

export function loadQuestions(config: ExamConfig): Question[] {
  const allSets = getAllExamSets()
  const years =
    config.year === 'all' ? [...AVAILABLE_YEARS] : [config.year as number]

  const questions = allSets
    .filter(
      (set) =>
        years.includes(set.year as (typeof AVAILABLE_YEARS)[number]) &&
        config.subjects.includes(set.subject),
    )
    .flatMap((set) => set.questions)

  return sortQuestions(questions)
}

export function countQuestions(config: ExamConfig): number {
  return loadQuestions(config).length
}
