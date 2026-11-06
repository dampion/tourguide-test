import { Link } from 'react-router-dom'
import { AVAILABLE_YEARS } from '../data/constants'

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-teal-700">華語導遊人員評量測驗</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          筆試考古題練習
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          使用交通部觀光署公布的考畢試題練習。可選擇指定年度或綜合所有年份，完成全部題目後一次送出並計分。
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5 text-left text-slate-700">
          <h2 className="font-semibold text-slate-900">考試說明</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
            <li>三科：導遊執業實務、導遊執業法規、觀光資源概要</li>
            <li>每科 50 題選擇題，每題 2 分，滿分 100 分</li>
            <li>三科平均達 60 分及格；任一科 0 分（含未作答）不予及格</li>
            <li>目前題庫：{AVAILABLE_YEARS.join('、')} 年</li>
          </ul>
        </div>

        <Link
          to="/setup"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-teal-700"
        >
          開始練習
        </Link>
      </div>
    </div>
  )
}
