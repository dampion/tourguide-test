#!/usr/bin/env node
/**
 * Validate exam JSON files
 * Usage: node scripts/validate-exams.mjs
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXAMS_DIR = path.join(__dirname, '..', 'src', 'data', 'exams')
const VALID_KEYS = new Set(['A', 'B', 'C', 'D'])
const EXPECTED_COUNT = 50

let hasError = false

async function validateFile(filePath) {
  const rel = path.relative(EXAMS_DIR, filePath)
  const raw = await readFile(filePath, 'utf8')
  const data = JSON.parse(raw)
  const issues = []

  if (!Array.isArray(data.questions)) {
    issues.push('missing questions array')
  } else {
    if (data.questions.length !== EXPECTED_COUNT) {
      issues.push(`expected ${EXPECTED_COUNT} questions, got ${data.questions.length}`)
    }

    const numbers = new Set()
    for (const q of data.questions) {
      numbers.add(q.number)
      if (!q.text?.trim()) issues.push(`Q${q.number}: empty text`)
      if (!VALID_KEYS.has(q.answer)) issues.push(`Q${q.number}: invalid answer ${q.answer}`)
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        issues.push(`Q${q.number}: expected 4 options`)
      } else {
        for (const opt of q.options) {
          if (!VALID_KEYS.has(opt.key)) issues.push(`Q${q.number}: invalid option key`)
        }
      }
      if (q.needsReview) issues.push(`Q${q.number}: flagged needsReview`)
    }

    for (let i = 1; i <= EXPECTED_COUNT; i++) {
      if (!numbers.has(i)) issues.push(`missing question number ${i}`)
    }
  }

  if (issues.length > 0) {
    hasError = true
    console.error(`✗ ${rel}`)
    for (const issue of issues.slice(0, 20)) {
      console.error(`    - ${issue}`)
    }
    if (issues.length > 20) {
      console.error(`    ... and ${issues.length - 20} more`)
    }
  } else {
    console.log(`✓ ${rel}`)
  }
}

async function main() {
  const years = await readdir(EXAMS_DIR)
  for (const year of years.sort()) {
    const yearDir = path.join(EXAMS_DIR, year)
    const files = (await readdir(yearDir)).filter((f) => f.endsWith('.json'))
    for (const file of files.sort()) {
      await validateFile(path.join(yearDir, file))
    }
  }

  if (hasError) {
    console.error('\nValidation failed.')
    process.exit(1)
  }
  console.log('\nAll exam files valid.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
