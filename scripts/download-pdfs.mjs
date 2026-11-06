#!/usr/bin/env node
/**
 * Download 華語導遊 past exam PDFs from register-exam.tad.gov.tw
 * Usage: node scripts/download-pdfs.mjs [113|114]
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'scripts', 'source-pdfs')
const BASE_URL = 'https://register-exam.tad.gov.tw/tourism/'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** 華語導遊人員 PDF 檔案代碼（依年度不同） */
const GUIDE_EXAM_FILES_BY_YEAR = {
  113: {
    practice: { questions: '1201Q.pdf', answers: '1201A.pdf', corrections: '1201AN.pdf' },
    regulation: { questions: '2201Q.pdf', answers: '2201A.pdf', corrections: '2201AN.pdf' },
    resources: { questions: '3201Q.pdf', answers: '3201A.pdf' },
  },
  114: {
    practice: { questions: '1301Q.pdf', answers: '1301A.pdf', corrections: '1301AN.pdf' },
    regulation: { questions: '2301Q.pdf', answers: '2301A.pdf' },
    resources: { questions: '3301Q.pdf', answers: '3301A.pdf', corrections: '3301AN.pdf' },
  },
}

const YEARS = process.argv.slice(2).map(Number).filter(Boolean)
const TARGET_YEARS = YEARS.length > 0 ? YEARS : [113, 114]

async function createSession(year) {
  const res = await fetch(`${BASE_URL}ExamQandAh?y=${year}`, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Failed to open exam page for ${year}: ${res.status}`)

  const setCookie = res.headers.getSetCookie?.() ?? []
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
  return cookie
}

async function downloadFile(url, dest, cookie) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      ...(cookie ? { Cookie: cookie } : {}),
    },
  })
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.slice(0, 5).toString() !== '%PDF-') {
    throw new Error(`Not a PDF (${buf.length} bytes)`)
  }
  await writeFile(dest, buf)
  return buf.length
}

async function downloadYear(year) {
  console.log(`\n=== ${year} 年 華語導遊 ===`)
  const cookie = await createSession(year)
  const yearDir = path.join(OUTPUT_DIR, String(year))
  await mkdir(yearDir, { recursive: true })

  const manifest = []

  const filesBySubject = GUIDE_EXAM_FILES_BY_YEAR[year]
  if (!filesBySubject) {
    throw new Error(`No PDF mapping for year ${year}`)
  }

  for (const [subject, files] of Object.entries(filesBySubject)) {
    for (const [type, filename] of Object.entries(files)) {
      const url = `${BASE_URL}doc/qah/${year}/${filename}`
      const dest = path.join(yearDir, `${subject}-${type}.pdf`)
      try {
        const size = await downloadFile(url, dest, cookie)
        console.log(`  ✓ ${subject}-${type}.pdf (${size} bytes)`)
        manifest.push({ subject, type, url, filename: `${subject}-${type}.pdf`, size })
      } catch (err) {
        console.error(`  ✗ ${subject}-${type}: ${err.message}`)
      }
    }
  }

  await writeFile(path.join(yearDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  for (const year of TARGET_YEARS) {
    await downloadYear(year)
  }
  console.log('\nDone. PDFs saved to scripts/source-pdfs/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
