import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AdminUsers() {
  const { t } = useLanguage();

  const { data: profiles } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderCounts } = useQuery({
    queryKey: ["admin-order-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("user_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((o) => { if (o.user_id) counts[o.user_id] = (counts[o.user_id] || 0) + 1; });
      return counts;
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("admin.users")}</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.user_name")}</TableHead>
                <TableHead>{t("admin.user_email")}</TableHead>
                <TableHead>{t("admin.user_orders")}</TableHead>
                <TableHead>{t("admin.user_gps")}</TableHead>
                <TableHead>{t("admin.user_registered")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                  <TableCell>{p.email || "—"}</TableCell>
                  <TableCell>{orderCounts?.[p.id] || 0}</TableCell>
                  <TableCell className="text-xs">{p.gps_lat && p.gps_lon ? `${p.gps_lat.toFixed(4)}, ${p.gps_lon.toFixed(4)}` : "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {profiles?.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("admin.no_users")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
