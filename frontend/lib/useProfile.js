import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { NAV } from "@/lib/nav";

/* Guards a page: loads the signed-in profile, and sends anyone with the wrong
   role back to their own dashboard. Every page used to repeat this. */
export function useProfile(expectedRole) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role, company_name, company_location, pincode, warehouse_id")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (error || !data) {
        router.replace("/login");
        return;
      }

      if (expectedRole && data.role !== expectedRole) {
        router.replace(NAV[data.role]?.home || "/login");
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [expectedRole, router]);

  return { profile, loading };
}

export default useProfile;
