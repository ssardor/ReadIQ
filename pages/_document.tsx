import { Html, Head, Main, NextScript } from 'next/document'

const themeInitializer = `(() => {
  try {
    const storageKey = 'readiq-theme'
    const stored = window.localStorage.getItem(storageKey)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch (error) {
    console.warn('Theme initialization failed', error)
  }
})()`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
