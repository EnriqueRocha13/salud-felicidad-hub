import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { BrandName } from "@/components/BrandName";

export default function Catalog() {
  const { addItem } = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("is_medical_article", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bundles } = useQuery({
    queryKey: ["bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*, bundle_products(product_id, products(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">
        Catálogo — <BrandName className="text-primary" />
      </h1>
      <p className="text-muted-foreground mb-8">Explora nuestros productos de salud</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin imagen</span>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                  <p className="text-primary font-bold text-xl mt-2">${product.price}</p>
                  <div className="flex gap-2 mt-3">
                    <Link to={`/product/${product.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" /> Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {bundles && bundles.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mt-12 mb-6">Conjuntos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((bundle) => (
                  <Link to={`/bundle/${bundle.id}`} key={bundle.id}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-muted flex items-center justify-center">
                        {bundle.image_url ? (
                          <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground text-sm">Conjunto</span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg">{bundle.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{bundle.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
