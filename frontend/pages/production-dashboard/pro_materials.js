import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { currency, number } from "@/lib/format";

export default function Materials() {
  const { profile, loading } = useProfile("Production Manager");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: link } = await supabase
        .from("production_manager_factory")
        .select("factory_id")
        .eq("prod_manager_id", profile.id)
        .maybeSingle();

      if (!link?.factory_id) {
        setBusy(false);
        return;
      }

      const { data } = await supabase
        .from("factory_inventory")
        .select("id, quantity, threshold_units, base_price, raw_materials(name, unit)")
        .eq("factory_id", link.factory_id);

      setRows(data || []);
      setBusy(false);
    };
    load();
  }, [profile]);

  if (loading) return null;

  return (
    <AppShell role="Production Manager" profile={profile} title="Raw materials" description="What this factory holds, against the level it should not drop below">
      <Card>
        <CardHeader title="Factory inventory" description={`${number(rows.length)} materials`} />
        {!busy && rows.length === 0 ? (
          <EmptyState icon={<Boxes className="h-5 w-5" />} title="No materials recorded" description="This account is not linked to a factory yet." />
        ) : (
          <Table
            loading={busy}
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { key: "material", header: "Material", strong: true, render: (r) => r.raw_materials?.name || "—" },
              { key: "quantity", header: "On hand", align: "right", render: (r) => `${number(r.quantity)} ${r.raw_materials?.unit || ""}` },
              { key: "threshold", header: "Threshold", align: "right", render: (r) => number(r.threshold_units) },
              { key: "price", header: "Unit cost", align: "right", render: (r) => currency(r.base_price) },
              { key: "value", header: "Value", align: "right", render: (r) => currency(Number(r.quantity) * Number(r.base_price)) },
              {
                key: "state",
                header: "State",
                render: (r) => (Number(r.quantity) < Number(r.threshold_units) ? <Badge tone="low">Reorder</Badge> : <Badge tone="ok">Healthy</Badge>),
              },
            ]}
          />
        )}
      </Card>
    </AppShell>
  );
}
