import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <Globe className="h-4 w-4 mr-1" />
      {lang === "es" ? "EN" : "ES"}
    </Button>
  );
}
