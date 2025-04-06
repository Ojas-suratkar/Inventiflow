import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import "../styles/globals.css"; // Import TailwindCSS styles

export default function MyApp({ Component, pageProps }: AppProps) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get session when app starts
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup the listener when component unmounts
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <main>
      <Component {...pageProps} session={session} />
    </main>
  );
}
