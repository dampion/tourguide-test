export type Subject = 'practice' | 'regulation' | 'resources'

export type AnswerKey = 'A' | 'B' | 'C' | 'D'

export interface QuestionOption {
  key: AnswerKey
  text: string
}

export interface Question {
  id: string
  year: number
  subject: Subject
  number: number
  text: string
  options: QuestionOption[]
  answer: AnswerKey
  acceptedAnswers?: AnswerKey[]
  needsReview?: boolean
}

export interface ExamSet {
  year: number
  subject: Subject
  questions: Question[]
}

export type YearSelection = number | 'all'

export interface ExamConfig {
  year: YearSelection
  subjects: Subject[]
}

export interface SubjectScore {
  subject: Subject
  year: number
  correctCount: number
  totalCount: number
  score: number
  maxScore: number
}

export interface ExamResult {
  subjectScores: SubjectScore[]
  average: number
  passed: boolean
  questionResults: QuestionResult[]
}

export interface QuestionResult {
  question: Question
  userAnswer: AnswerKey | null
  isCorrect: boolean
}

export type UserAnswers = Record<string, AnswerKey | null>
