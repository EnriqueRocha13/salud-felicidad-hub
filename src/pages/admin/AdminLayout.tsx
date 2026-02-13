import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { BrandName } from "@/components/BrandName";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Users, ShoppingBag, MessageSquare, Layers, Home, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Productos", icon: Package },
  { to: "/admin/bundles", label: "Conjuntos", icon: Layers },
  { to: "/admin/users", label: "Usuarios", icon: Users },
  { to: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/chat", label: "Soporte", icon: MessageSquare },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card p-4">
        <BrandName className="text-lg text-primary mb-6 block" />
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant={location.pathname === item.to ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="border-t pt-4 space-y-2">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" /> Sitio Público
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className="flex-1 flex flex-col items-center py-2 text-xs">
            <item.icon className={`h-5 w-5 ${location.pathname === item.to ? "text-primary" : "text-muted-foreground"}`} />
            <span className={location.pathname === item.to ? "text-primary font-medium" : "text-muted-foreground"}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 pb-20 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
