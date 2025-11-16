import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { LandingHero } from '@/components/LandingHero'
import { useTranslation } from '@/components/SettingsProvider'

export default function Home() {
  const t = useTranslation()
  return (
    <>
      <Head>
        <title>{t('ReadIQ - Master reading comprehension in minutes')}</title>
        <meta
          name="description"
          content={t('Quick assessments that help students improve reading skills and stay motivated.')}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <LandingHero />
        
        <footer className="bg-gray-50 border-t py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">ReadIQ</h3>
                <p className="text-sm text-gray-600">
                  {t('Empowering students with effective reading comprehension tools.')}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">{t('Quick links')}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/signup" className="text-gray-600 hover:text-primary-600">
                      {t('Get started')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-gray-600 hover:text-primary-600">
                      {t('Log in')}
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">{t('Legal')}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-primary-600">
                      {t('Privacy policy')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-primary-600">
                      {t('Terms of service')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
              {t('© {{year}} ReadIQ. All rights reserved.', { year: new Date().getFullYear() })}
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
