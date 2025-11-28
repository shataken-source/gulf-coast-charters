import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(null)
ECHO is off.
  useEffect(() => {
    supabase.auth.getSession().then((result) => setSession(result.data.session))
  }, [])
ECHO is off.
  return <Component session={session} {...pageProps} />
}
