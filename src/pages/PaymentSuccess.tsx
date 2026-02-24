import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { BrandName } from "@/components/BrandName";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      supabase
        .from("orders")
        .update({ status: "paid", payment_method: "stripe" })
        .eq("id", orderId)
        .then(({ error }) => {
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
          <h1 className="text-2xl font-bold">¡Pago exitoso!</h1>
          <p className="text-muted-foreground">
            Tu pedido ha sido procesado correctamente. Recibirás una confirmación pronto.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
