export const metadata = {
  title: 'AI Tech Support Demo',
  description: 'AI-powered product support demonstration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
