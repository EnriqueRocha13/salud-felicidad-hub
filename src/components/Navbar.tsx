import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandName } from "@/components/BrandName";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandName className="text-xl text-primary" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Catálogo
          </Link>
          <Link to="/support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Soporte
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-1" /> Iniciar Sesión
              </Button>
            </Link>
          )}
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {itemCount}
              </Badge>
            )}
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-3">
          <Link to="/catalog" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Catálogo</Link>
          <Link to="/support" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Soporte</Link>
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
              <LogOut className="h-4 w-4 mr-1" /> Cerrar Sesión
            </Button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full"><User className="h-4 w-4 mr-1" /> Iniciar Sesión</Button>
            </Link>
          )}
          <Link to="/cart" className="flex items-center gap-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
            <ShoppingCart className="h-4 w-4" /> Carrito {itemCount > 0 && `(${itemCount})`}
          </Link>
        </div>
      )}
    </nav>
  );
}
