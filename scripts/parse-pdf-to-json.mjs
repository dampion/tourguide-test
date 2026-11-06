#!/usr/bin/env node
/**
 * Parse exam PDFs to JSON
 * Usage: node scripts/parse-pdf-to-json.mjs [113|114]
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCE_DIR = path.join(ROOT, 'scripts', 'source-pdfs')
const OUTPUT_DIR = path.join(ROOT, 'src', 'data', 'exams')

const SUBJECTS = ['practice', 'regulation', 'resources']
const YEARS = process.argv.slice(2).map(Number).filter(Boolean)
const TARGET_YEARS = YEARS.length > 0 ? YEARS : [113, 114]

const OPTION_MARKERS = {
  '\uE18C': 'A',
  '\uE18D': 'B',
  '\uE18E': 'C',
  '\uE18F': 'D',
}

async function extractText(pdfPath) {
  const buffer = await readFile(pdfPath)
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return result.text
}

function normalizeText(text) {
  let normalized = text.replace(/\r/g, '')

  for (const [marker, key] of Object.entries(OPTION_MARKERS)) {
    normalized = normalized.split(marker).join(`\n${key}. `)
  }

  normalized = normalized
    .replace(/-- \d+ of \d+ --/g, '\n')
    .replace(/代號：\d+/g, '')
    .replace(/頁次：[^\n]+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')

  return normalized.trim()
}

function isQuestionStart(text, index) {
  const slice = text.slice(index)
  const match = slice.match(/^((?:[1-9]|[1-4]\d|50)) ([^\s\n])/)
  if (!match) return false

  const num = Number(match[1])
  const after = slice.slice(match[0].length)

  if (num < 10 && /^(\n[ABCD]\.|[萬元])/.test(after)) return false
  if (/^(?:18|19|20)\d{2}\b/.test(after)) return true
  if (/^\d{2,3}\s+[\u4e00-\u9fff]/.test(after)) return true
  if (/^[\u4e00-\u9fff《「（(【A-Za-z]/.test(after)) return true
  return false
}

function findQuestionStarts(text) {
  const starts = []
  const regex = /(?:^|\n)((?:[1-9]|[1-4]\d|50)) /g
  let match

  while ((match = regex.exec(text)) !== null) {
    const index = match.index + (match[0].startsWith('\n') ? 1 : 0)
    if (isQuestionStart(text, index)) {
      starts.push(index)
    }
  }

  return starts
}

function repairYearOptions(rest, options) {
  if (options.length !== 4) return options
  if (!options.every((o) => /年/.test(o.text) && o.text.length < 8)) return options

  const leading = rest.match(/？\s*(\d)\s+\nA\./)?.[1]
  const trailing = [...rest.matchAll(/年\s*(\d)/g)].map((m) => m[1])
  const years = leading ? [leading, ...trailing] : trailing

  if (years.length !== 4) return options

  return options.map((option, index) => ({
    ...option,
    text: `${years[index]}年`,
  }))
}

function parseQuestions(text) {
  const normalized = normalizeText(text)
  const start = normalized.search(/\n1 \S/)
  const body = start >= 0 ? normalized.slice(start + 1) : normalized

  const offsets = findQuestionStarts(body)
  const chunks = []

  for (let i = 0; i < offsets.length; i++) {
    const begin = offsets[i]
    const end = offsets[i + 1] ?? body.length
    chunks.push(body.slice(begin, end))
  }

  const questions = []

  for (const chunk of chunks) {
    const trimmed = chunk.trim()
    const numberMatch = trimmed.match(/^(\d{1,2}) /)
    if (!numberMatch) continue

    const number = Number(numberMatch[1])
    if (number < 1 || number > 50) continue

    const rest = trimmed.slice(numberMatch[0].length)
    const optionRegex = /(?:^|\n)([ABCD])\.\s*([\s\S]*?)(?=(?:\n[ABCD]\.)|(?:\n(?:[1-9]|[1-4]\d|50) )|$)/g
    const options = []
    let match

    while ((match = optionRegex.exec(rest)) !== null) {
      options.push({
        key: match[1],
        text: match[2].replace(/\s+/g, ' ').trim(),
      })
    }

    const firstOption = rest.search(/\n[ABCD]\./)
    let questionText =
      firstOption === -1
        ? rest.replace(/\s+/g, ' ').trim()
        : rest.slice(0, firstOption).replace(/\s+/g, ' ').trim()

    questionText = questionText.replace(/\s+\d{1,2}$/, '').trim()

    if (options.length < 4 || !questionText) continue

    questions.push({
      number,
      text: questionText,
      options: repairYearOptions(rest, options.slice(0, 4)),
    })
  }

  return questions.sort((a, b) => a.number - b.number)
}

function parseAnswerTable(text) {
  const answers = new Map()
  const blocks = text.split('題號').slice(1)

  for (const block of blocks) {
    const numbers = [...block.matchAll(/第\s*(\d+)\s*題/g)].map((m) => Number(m[1]))
    const answerLine = block.match(/答案\s*([^\n]+)/)
    if (!answerLine || numbers.length === 0) continue

    const tokens = answerLine[1]
      .trim()
      .split(/\s+/)
      .map((t) => t.replace(/[^A-D]/g, ''))
      .filter((t) => /^[A-D]$/.test(t))

    numbers.forEach((num, index) => {
      const key = tokens[index]
      if (key) answers.set(num, key)
    })
  }

  return answers
}

function parseMultiAcceptedAnswers(text) {
  const multi = new Map()
  const regex = /第\s*(\d+)\s*題答([^；;\n]+)者均給分/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const num = Number(match[1])
    const part = match[2]
    const accepted = []

    if (/[ＡA]/.test(part)) accepted.push('A')
    if (/[ＢB]/.test(part)) accepted.push('B')
    if (/[ＣC]/.test(part)) accepted.push('C')
    if (/[ＤD]/.test(part)) accepted.push('D')

    if (accepted.length > 0) multi.set(num, accepted)
  }

  return multi
}

async function parseSubject(year, subject) {
  const yearDir = path.join(SOURCE_DIR, String(year))
  const questionsPath = path.join(yearDir, `${subject}-questions.pdf`)
  const answersPath = path.join(yearDir, `${subject}-answers.pdf`)
  const correctionsPath = path.join(yearDir, `${subject}-corrections.pdf`)

  const questionsText = await extractText(questionsPath)
  const parsedQuestions = parseQuestions(questionsText)

  let answers = new Map()
  let multiAccepted = new Map()

  try {
    const answersText = await extractText(answersPath)
    answers = parseAnswerTable(answersText)
  } catch {
    console.warn(`  ! No answers PDF for ${year} ${subject}`)
  }

  try {
    const correctionsText = await extractText(correctionsPath)
    const correctedAnswers = parseAnswerTable(correctionsText)
    for (const [num, key] of correctedAnswers) {
      answers.set(num, key)
    }
    multiAccepted = parseMultiAcceptedAnswers(correctionsText)
  } catch {
    // optional
  }

  const questions = []

  for (let num = 1; num <= 50; num++) {
    const parsed = parsedQuestions.find((q) => q.number === num)
    const answer = answers.get(num)
    const acceptedAnswers = multiAccepted.get(num)
    const needsReview = !parsed || !answer || parsed.options.length !== 4

    if (!parsed) {
      questions.push({
        id: `${year}-${subject}-${num}`,
        year,
        subject,
        number: num,
        text: `（第 ${num} 題解析失敗，請參考官方 PDF）`,
        options: [
          { key: 'A', text: 'A' },
          { key: 'B', text: 'B' },
          { key: 'C', text: 'C' },
          { key: 'D', text: 'D' },
        ],
        answer: answer ?? 'A',
        needsReview: true,
        ...(acceptedAnswers ? { acceptedAnswers } : {}),
      })
      continue
    }

    questions.push({
      id: `${year}-${subject}-${num}`,
      year,
      subject,
      number: num,
      text: parsed.text,
      options: parsed.options,
      answer,
      ...(acceptedAnswers ? { acceptedAnswers } : {}),
      ...(needsReview ? { needsReview: true } : {}),
    })
  }

  return { year, subject, questions }
}

async function main() {
  for (const year of TARGET_YEARS) {
    const outYearDir = path.join(OUTPUT_DIR, String(year))
    await mkdir(outYearDir, { recursive: true })

    console.log(`\n=== Parsing ${year} ===`)
    for (const subject of SUBJECTS) {
      try {
        const examSet = await parseSubject(year, subject)
        const outPath = path.join(outYearDir, `${subject}.json`)
        await writeFile(outPath, JSON.stringify(examSet, null, 2))
        const reviewCount = examSet.questions.filter((q) => q.needsReview).length
        console.log(
          `  ✓ ${subject}.json — ${examSet.questions.length} questions (${reviewCount} need review)`,
        )
      } catch (err) {
        console.error(`  ✗ ${subject}: ${err.message}`)
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
