import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { BrandName } from "@/components/BrandName";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { t } = useLanguage();

  useEffect(() => {
    if (orderId) {
      supabase.from("orders").update({ status: "paid", payment_method: "stripe" }).eq("id", orderId).then(({ error }) => {
        if (error) console.error("Error updating order:", error);
      });
    }
  }, [orderId]);

  return (
    <div className="container py-16 max-w-lg text-center">
      <BrandName className="text-sm text-primary mb-4 block" />
      <Card>
        <CardContent className="p-8 space-y-4">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">{t("payment.title")}</h1>
          <p className="text-muted-foreground">{t("payment.description")}</p>
          <Button onClick={() => navigate("/")} className="w-full">{t("payment.back")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
