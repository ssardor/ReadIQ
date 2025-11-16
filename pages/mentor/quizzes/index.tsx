import React from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import { QuizListTable } from '@/components/QuizListTable'
import Link from 'next/link'
import { BackButton } from '@/components/BackButton'

export default function MentorQuizzes() {
  return (
    <>
      <Head><title>Quizzes - Mentor</title></Head>
      <div className="max-w-7xl mx-auto p-6">
        <BackButton href="/dashboard" className="mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <Link href="/mentor/quizzes/new" className="px-4 py-2 rounded bg-primary-600 text-white">New Quiz</Link>
        </div>
        <QuizListTable />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const res = await requireMentor(ctx)
  if ('redirect' in res) return res as any
  return { props: {} }
}
