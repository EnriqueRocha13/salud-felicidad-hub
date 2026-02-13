import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AdminOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), profiles:user_id(display_name, email, gps_lat, gps_lon)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-primary/20 text-primary";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {orders?.map((order) => {
            const profile = order.profiles as any;
            return (
              <AccordionItem key={order.id} value={order.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <div>
                      <p className="font-semibold">{profile?.display_name || profile?.email || "Usuario"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <Badge className={statusColor(order.status)}>{order.status}</Badge>
                    <span className="font-bold text-primary">${order.total_price}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="text-sm space-y-1">
                      <p><strong>Email:</strong> {profile?.email || "—"}</p>
                      <p><strong>GPS Pedido:</strong> {order.gps_lat && order.gps_lon ? `${order.gps_lat.toFixed(4)}, ${order.gps_lon.toFixed(4)}` : "—"}</p>
                      <p><strong>GPS Usuario:</strong> {profile?.gps_lat && profile?.gps_lon ? `${profile.gps_lat.toFixed(4)}, ${profile.gps_lon.toFixed(4)}` : "—"}</p>
                      <p><strong>Método de pago:</strong> {order.payment_method || "—"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Productos:</h4>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm border-b py-1">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span className="font-medium">${(item.price_at_order * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          {orders?.length === 0 && <p className="text-center text-muted-foreground py-8">Sin pedidos</p>}
        </Accordion>
      )}
    </div>
  );
}
