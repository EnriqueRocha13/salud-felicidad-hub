import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandName } from "@/components/BrandName";
import { ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Index() {
  const { t } = useLanguage();

  const { data: medicalArticles } = useQuery({
    queryKey: ["medical-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_medical_article", true)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    if (!medicalArticles?.length) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        const newPos = scrollPos >= maxScroll ? 0 : scrollPos + 300;
        scrollRef.current.scrollTo({ left: newPos, behavior: "smooth" });
        setScrollPos(newPos);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [scrollPos, medicalArticles]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/30 py-20 md:py-32">
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <Heart className="h-4 w-4" /> {t("hero.badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <BrandName className="text-primary" />
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/catalog">
              <Button size="lg" className="gap-2">
                <ShoppingCart className="h-5 w-5" /> {t("hero.cta_catalog")}
              </Button>
            </Link>
            <Link to="/support">
              <Button variant="outline" size="lg">
                {t("hero.cta_support")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.15),_transparent_50%)]" />
      </section>

      {/* Medical Articles Carousel */}
      {medicalArticles && medicalArticles.length > 0 && (
        <section className="py-12 bg-card">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">{t("index.medical_articles")}</h2>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {medicalArticles.map((article) => (
                <Link
                  to={`/product/${article.id}`}
                  key={article.id}
                  className="flex-shrink-0 w-64 snap-start group"
                >
                  <div className="rounded-lg overflow-hidden border bg-background hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-white flex items-center justify-center overflow-hidden p-2">
                      {article.image_url ? (
                        <img src={article.image_url} alt={article.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <span className="text-muted-foreground text-sm">{t("index.no_image")}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{article.name}</h3>
                      <p className="text-primary font-bold mt-1">${article.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4">
            {t("index.cta_title")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            {t("index.cta_subtitle")}
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              {t("index.cta_button")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
