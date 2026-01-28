import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect root to a default demo or show a landing page
  redirect('/demo/graco')
}
