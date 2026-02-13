import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { BrandName } from "@/components/BrandName";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const handleBuy = () => {
    if (!user) {
      navigate("/auth", { state: { from: `/product/${id}` } });
      return;
    }
    if (product) {
      addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
      navigate("/cart");
    }
  };

  if (isLoading) return <div className="container py-8"><div className="animate-pulse h-96 bg-muted rounded-lg" /></div>;
  if (!product) return <div className="container py-8 text-center">Producto no encontrado</div>;

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain max-h-[500px]" />
          ) : (
            <span className="text-muted-foreground">Sin imagen</span>
          )}
        </div>
        <div>
          <BrandName className="text-sm text-primary mb-2 block" />
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-4 text-lg">{product.description}</p>
          <p className="text-primary font-bold text-3xl mt-6">${product.price}</p>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" /> Agregar al Carrito
            </Button>
            <Button size="lg" onClick={handleBuy}>
              Comprar Ahora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
