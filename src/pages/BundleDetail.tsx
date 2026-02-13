import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Share2, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { BrandName } from "@/components/BrandName";
import { useToast } from "@/hooks/use-toast";

export default function BundleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["bundle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*, bundle_products(product_id, products(*))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const shareUrl = window.location.href;

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareToInstagram = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Enlace copiado", description: "Pega el enlace en Instagram" });
  };

  if (isLoading) return <div className="container py-8"><div className="animate-pulse h-96 bg-muted rounded-lg" /></div>;
  if (!bundle) return <div className="container py-8 text-center">Conjunto no encontrado</div>;

  const products = bundle.bundle_products?.map((bp: any) => bp.products).filter(Boolean) || [];

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
      </Button>
      <BrandName className="text-sm text-primary mb-2 block" />
      <h1 className="text-3xl font-bold">{bundle.name}</h1>
      <p className="text-muted-foreground mt-2">{bundle.description}</p>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={shareToFacebook}>
          <Share2 className="h-4 w-4 mr-1" /> Facebook
        </Button>
        <Button variant="outline" size="sm" onClick={shareToInstagram}>
          <Share2 className="h-4 w-4 mr-1" /> Instagram
        </Button>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Productos del conjunto</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product: any) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="h-40 bg-muted flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-sm">Sin imagen</span>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-primary font-bold mt-1">${product.price}</p>
              <div className="flex gap-2 mt-2">
                <Link to={`/product/${product.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Ver</Button>
                </Link>
                <Button size="sm" className="flex-1" onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })}>
                  <ShoppingCart className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
