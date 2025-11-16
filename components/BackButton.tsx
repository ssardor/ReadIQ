import React, { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '@/components/SettingsProvider'

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
  fallbackHref?: string
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  label,
  className = '',
  fallbackHref = '/',
}) => {
  const router = useRouter()
  const t = useTranslation()

  const handleClick = useCallback(() => {
    if (href) {
      router.push(href)
      return
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }, [router, href, fallbackHref])

  const displayLabel = label ?? t('← Back')

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 ${className}`.trim()}
    >
      {displayLabel}
    </button>
  )
}
