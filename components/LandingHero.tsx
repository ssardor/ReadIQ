import React from 'react'
import Link from 'next/link'
import { useTranslation } from '@/components/SettingsProvider'

export const LandingHero: React.FC = () => {
  const t = useTranslation()
  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-4 py-20 bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">ReadIQ</h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-4">
          {t('Master reading comprehension in minutes.')}
        </p>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
          {t('Quick 5-minute assessments designed by educators to help students improve reading skills and track progress effectively.')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg shadow-lg hover:bg-primary-700 transition-all transform hover:scale-105"
          >
            {t('Get started')}
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-all"
          >
            {t('Log in')}
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">{t('Quick and efficient')}</h3>
            <p className="text-gray-600">
              {t('Five-minute assessments that fit into any schedule.')}
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">{t('Track progress')}</h3>
            <p className="text-gray-600">
              {t('Monitor improvement with detailed analytics.')}
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-semibold mb-2">{t('Teacher-designed')}</h3>
            <p className="text-gray-600">
              {t('Created by educators for real learning outcomes.')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
