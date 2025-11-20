import React from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import { motion } from 'framer-motion'
import { BackButton } from '@/components/BackButton'
import { useTranslation } from '@/components/SettingsProvider'

export default function MentorDashboard() {
  const t = useTranslation()
  const quickActions = [
    t('Create Group'),
    t('Create Quiz'),
    t('Start Live Quiz'),
    t('Invite Students'),
  ]

  return (
    <>
      <Head>
        <title>Mentor Dashboard - ReadIQ</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <BackButton href="/dashboard" className="mb-4" />
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{t('Mentor Dashboard')}</h1>
            <p className="text-gray-600">{t('Quick overview of key metrics and actions')}</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { title: t('Active groups'), value: '—' },
              { title: t('Active quizzes today'), value: '—' },
              { title: t('Average comprehension'), value: '—' },
              { title: t('Alerts'), value: '—' },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">{c.title}</div>
                <div className="text-2xl font-semibold">{c.value}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {quickActions.map((label, index) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-primary-600 text-white rounded-md px-4 py-3 shadow hover:bg-primary-700"
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const res = await requireMentor(ctx)
  // redirect if not mentor
  if ('redirect' in res) return res as any
  return { props: {} }
}
