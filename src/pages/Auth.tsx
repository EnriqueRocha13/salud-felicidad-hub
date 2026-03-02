import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { BrandName } from "@/components/BrandName";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const redirectTo = (location.state as any)?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password, displayName);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else if (isLogin) {
      toast({ title: t("auth.welcome") });
      navigate(redirectTo);
    } else {
      toast({ title: t("auth.register_success"), description: t("auth.register_confirm") });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandName className="text-2xl text-primary mb-2 block" />
          <CardTitle>{isLogin ? t("auth.login") : t("auth.register")}</CardTitle>
          <CardDescription>{isLogin ? t("auth.login_desc") : t("auth.register_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input placeholder={t("auth.name")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            )}
            <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.loading") : isLogin ? t("auth.submit_login") : t("auth.submit_register")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button type="button" className="text-primary hover:underline" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? t("auth.switch_to_register") : t("auth.switch_to_login")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
