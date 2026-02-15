import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandName } from "@/components/BrandName";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const { signIn, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Once isAdmin becomes true after login, navigate to admin
  useEffect(() => {
    if (waitingForAdmin && user && isAdmin) {
      navigate("/admin");
    }
  }, [waitingForAdmin, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      // Wait for isAdmin to be set by AuthContext
      setWaitingForAdmin(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <BrandName className="text-xl text-primary mb-2 block" />
          <CardTitle className="text-lg">Acceso Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="Correo del administrador" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading || waitingForAdmin}>
              {loading || waitingForAdmin ? "Verificando..." : "Acceder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
