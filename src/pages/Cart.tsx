import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { BrandName } from "@/components/BrandName";

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/cart" } });
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
        <p className="text-muted-foreground mb-4">Explora nuestro catálogo y agrega productos</p>
        <Button onClick={() => navigate("/catalog")}>Ver Catálogo</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <BrandName className="text-sm text-primary mb-2 block" />
      <h1 className="text-3xl font-bold mb-6">Carrito</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-primary font-bold">${item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-bold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
        </CardContent>
      </Card>
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={clearCart}>Vaciar Carrito</Button>
        <Button className="flex-1" size="lg" onClick={handleCheckout}>
          Proceder al Pago
        </Button>
      </div>
    </div>
  );
}
