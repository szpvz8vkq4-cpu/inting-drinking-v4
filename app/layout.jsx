import './globals.css'

export const metadata = {
  title: 'Nexus Fiesta V4.4',
  description: 'Party app LoL online avec rooms, chat, roulette, gages et cyberpunk UI'
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
