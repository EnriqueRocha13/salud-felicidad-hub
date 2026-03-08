import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Share2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { BrandName } from "@/components/BrandName";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  // Update OG meta tags dynamically for social sharing
  useEffect(() => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.id}`;
    document.title = `${product.name} — Salud=Felicidad();`;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("og:title", product.name);
    setMeta("og:description", product.description || `$${product.price} — Salud=Felicidad();`);
    setMeta("og:url", url);
    setMeta("og:type", "product");
    if (product.image_url) setMeta("og:image", product.image_url);
    setMeta("product:price:amount", String(product.price));
    setMeta("product:price:currency", "USD");

    return () => { document.title = "Salud=Felicidad();"; };
  }, [product]);

  const copyLink = () => {
    const url = `${window.location.origin}/product/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: t("product.link_copied"), description: t("product.link_copied_desc") });
  };

  const handleBuy = () => {
    if (!user) { navigate("/auth", { state: { from: `/product/${id}` } }); return; }
    if (product) { addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url }); navigate("/cart"); }
  };

  if (isLoading) return <div className="container py-8"><div className="animate-pulse h-96 bg-muted rounded-lg" /></div>;
  if (!product) return <div className="container py-8 text-center">{t("product.not_found")}</div>;

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("product.back")}
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain max-h-[500px]" />
          ) : (
            <span className="text-muted-foreground">{t("product.no_image")}</span>
          )}
        </div>
        <div>
          <BrandName className="text-sm text-primary mb-2 block" />
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-4 text-lg">{product.description}</p>
          <p className="text-primary font-bold text-3xl mt-6">${product.price}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button variant="outline" size="lg" onClick={() => { addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url }); }}>
              <ShoppingCart className="h-5 w-5 mr-2" /> {t("product.add_to_cart")}
            </Button>
            <Button size="lg" onClick={handleBuy}>{t("product.buy_now")}</Button>
            <Button variant="outline" size="lg" onClick={copyLink}>
              <Share2 className="h-4 w-4 mr-2" /> {t("product.copy_link")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{t("product.share_hint")}</p>
        </div>
      </div>
    </div>
  );
}
