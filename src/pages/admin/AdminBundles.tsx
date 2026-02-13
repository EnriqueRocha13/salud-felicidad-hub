import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminBundles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: bundles } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*, bundle_products(product_id, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name").eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: bundle, error } = await supabase
        .from("product_bundles")
        .insert({ name: form.name, description: form.description })
        .select()
        .single();
      if (error || !bundle) throw error;

      if (selectedProducts.length > 0) {
        await supabase.from("bundle_products").insert(
          selectedProducts.map((pid) => ({ bundle_id: bundle.id, product_id: pid }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "Conjunto creado" });
      setForm({ name: "", description: "" });
      setSelectedProducts([]);
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_bundles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "Conjunto eliminado" });
    },
  });

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/bundle/${id}`);
    toast({ title: "Enlace copiado" });
  };

  const shareToFacebook = (id: string) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/bundle/${id}`)}`, "_blank");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Conjuntos de Productos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Generar Conjunto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Conjunto</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <Input placeholder="Nombre del conjunto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div>
                <Label className="mb-2 block">Seleccionar productos</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                  {products?.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedProducts.includes(p.id)}
                        onCheckedChange={(checked) => {
                          setSelectedProducts(checked ? [...selectedProducts, p.id] : selectedProducts.filter((id) => id !== p.id));
                        }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Creando..." : "Crear Conjunto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {bundles?.map((bundle) => (
          <Card key={bundle.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{bundle.name}</h3>
                  <p className="text-sm text-muted-foreground">{bundle.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bundle.bundle_products?.length || 0} productos
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(bundle.id)}><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => shareToFacebook(bundle.id)}>FB</Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(bundle.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {bundles?.length === 0 && <p className="text-center text-muted-foreground py-8">No hay conjuntos aún</p>}
      </div>
    </div>
  );
}
