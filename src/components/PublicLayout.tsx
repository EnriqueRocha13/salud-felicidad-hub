import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BrandName } from "@/components/BrandName";
import { useLanguage } from "@/i18n/LanguageContext";

export function PublicLayout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <BrandName className="text-primary" /> © {new Date().getFullYear()} — {t("footer.rights")}
        </div>
      </footer>
    </div>
  );
}
