import type { Subject } from './types'

export const SUBJECT_LABELS: Record<Subject, string> = {
  practice: '導遊執業實務',
  regulation: '導遊執業法規',
  resources: '觀光資源概要',
}

export const SUBJECT_ORDER: Subject[] = ['practice', 'regulation', 'resources']

export const AVAILABLE_YEARS = [113, 114] as const

export const POINTS_PER_QUESTION = 2
export const QUESTIONS_PER_SUBJECT = 50
export const PASS_AVERAGE = 60
