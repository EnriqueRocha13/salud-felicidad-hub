import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", is_medical_article: false });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let image_url: string | undefined;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        is_medical_article: form.is_medical_article,
        ...(image_url ? { image_url } : {}),
      };

      if (editId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: editId ? "Producto actualizado" : "Producto creado" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Producto eliminado" });
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", is_medical_article: false });
    setImageFile(null);
    setEditId(null);
    setOpen(false);
  };

  const startEdit = (product: any) => {
    setForm({ name: product.name, description: product.description || "", price: String(product.price), is_medical_article: product.is_medical_article });
    setEditId(product.id);
    setOpen(true);
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/product/${id}`);
    toast({ title: "Enlace copiado" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Agregar Producto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input type="number" step="0.01" placeholder="Precio" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <div>
                <Label>Imagen del producto</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_medical_article} onCheckedChange={(v) => setForm({ ...form, is_medical_article: v })} />
                <Label>Artículo médico (aparece en carrusel)</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {products?.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">${product.price} {product.is_medical_article && "· Artículo médico"}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(product.id)}><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(product)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {products?.length === 0 && <p className="text-center text-muted-foreground py-8">No hay productos aún</p>}
        </div>
      )}
    </div>
  );
}
