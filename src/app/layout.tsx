import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UMGORA — Exclusive Membership',
  description: 'UMGORA is an exclusive private membership club. Secure your place among a curated community of extraordinary individuals.',
  keywords: 'UMGORA, exclusive membership, private club, VIP membership',
  openGraph: {
    title: 'UMGORA — Exclusive Membership',
    description: 'Secure your place among a curated community of extraordinary individuals.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
