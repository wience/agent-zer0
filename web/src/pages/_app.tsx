import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google'
import '../index.css';
import '../App.scss';
import '../components/button/Button.scss';
import '../components/toggle/Toggle.scss';
import '../pages/ConsolePage.scss';
import { useEffect } from 'react';
import { supabseAuthClient } from '@/lib/supabase/auth';



// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'], weight: "400" })

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    supabseAuthClient.supabaseAuth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        localStorage.setItem('sb-access-token', session.access_token);
        localStorage.setItem('sb-refresh-token', session.refresh_token);
        return;
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        return;
      }
    });
  }, []);
  return <main className={inter.className}><Component {...pageProps} /></main>;
}
