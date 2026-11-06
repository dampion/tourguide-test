import type { ExamSet } from './types'

import practice113 from './exams/113/practice.json'
import regulation113 from './exams/113/regulation.json'
import resources113 from './exams/113/resources.json'
import practice114 from './exams/114/practice.json'
import regulation114 from './exams/114/regulation.json'
import resources114 from './exams/114/resources.json'

const examSets: ExamSet[] = [
  practice113 as ExamSet,
  regulation113 as ExamSet,
  resources113 as ExamSet,
  practice114 as ExamSet,
  regulation114 as ExamSet,
  resources114 as ExamSet,
]

export function getAllExamSets(): ExamSet[] {
  return examSets
}

export function getExamSet(year: number, subject: ExamSet['subject']): ExamSet | undefined {
  return examSets.find((set) => set.year === year && set.subject === subject)
}
