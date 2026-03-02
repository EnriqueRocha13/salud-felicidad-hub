import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, CreditCard } from "lucide-react";
import { BrandName } from "@/components/BrandName";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestGps = () => {
    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLoadingGps(false); toast({ title: t("checkout.location_captured") }); },
      (err) => { setLoadingGps(false); toast({ title: t("checkout.gps_error"), description: err.message, variant: "destructive" }); }
    );
  };

  const handleStripePayment = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({ user_id: user.id, total_price: total, gps_lat: gps?.lat ?? null, gps_lon: gps?.lon ?? null, payment_method: "stripe", status: "pending" }).select().single();
      if (error || !order) { toast({ title: t("error"), description: t("checkout.order_error"), variant: "destructive" }); setSubmitting(false); return; }
      await supabase.from("order_items").insert(items.map((item) => ({ order_id: order.id, product_id: item.id, quantity: item.quantity, price_at_order: item.price, product_name: item.name })));
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", { body: { items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })), orderId: order.id } });
      if (paymentError || !paymentData?.url) { toast({ title: t("error"), description: t("checkout.payment_error"), variant: "destructive" }); setSubmitting(false); return; }
      clearCart();
      window.location.href = paymentData.url;
    } catch {
      toast({ title: t("error"), description: t("checkout.unexpected_error"), variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (items.length === 0) { navigate("/cart"); return null; }

  return (
    <div className="container py-8 max-w-lg">
      <BrandName className="text-sm text-primary mb-2 block" />
      <h1 className="text-2xl font-bold mb-6">{t("checkout.title")}</h1>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-lg">{t("checkout.summary")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>{t("checkout.total")}</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("checkout.location")}</p>
              {gps ? (
                <p className="text-sm text-muted-foreground">📍 {gps.lat.toFixed(4)}, {gps.lon.toFixed(4)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("checkout.location_share")}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={requestGps} disabled={loadingGps}>
              {loadingGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
              {gps ? t("checkout.location_update") : t("checkout.location_get")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleStripePayment} disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
        {t("checkout.pay")} · ${total.toFixed(2)} MXN
      </Button>
    </div>
  );
}
