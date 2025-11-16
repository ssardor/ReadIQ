import React from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import { QuizBuilderWizard } from '@/components/QuizBuilderWizard'
import { useRouter } from 'next/router'
import { BackButton } from '@/components/BackButton'

export default function NewQuiz() {
  const router = useRouter()
  return (
    <>
      <Head><title>Create Quiz - Mentor</title></Head>
      <div className="max-w-4xl mx-auto p-6">
        <BackButton href="/mentor/quizzes" className="mb-4" />
        <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>
        <QuizBuilderWizard onCreated={(id)=> router.push('/mentor/quizzes')} />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const res = await requireMentor(ctx)
  if ('redirect' in res) return res as any
  return { props: {} }
}
