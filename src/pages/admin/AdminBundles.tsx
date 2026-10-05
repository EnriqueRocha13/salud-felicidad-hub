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
import { useLanguage } from "@/i18n/LanguageContext";
import { Plus, Trash2, Share2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminBundles() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: bundles } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_bundles").select("*, bundle_products(product_id, products(name))").order("created_at", { ascending: false });
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
      if (editId) {
        const { error } = await supabase.from("product_bundles").update({ name: form.name, description: form.description }).eq("id", editId);
        if (error) throw error;
        await supabase.from("bundle_products").delete().eq("bundle_id", editId);
        if (selectedProducts.length > 0) await supabase.from("bundle_products").insert(selectedProducts.map((pid) => ({ bundle_id: editId, product_id: pid })));
      } else {
        const { data: bundle, error } = await supabase.from("product_bundles").insert({ name: form.name, description: form.description }).select().single();
        if (error || !bundle) throw error;
        if (selectedProducts.length > 0) await supabase.from("bundle_products").insert(selectedProducts.map((pid) => ({ bundle_id: bundle.id, product_id: pid })));
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bundles"] }); toast({ title: editId ? t("admin.bundle_updated") : t("admin.bundle_created") }); resetForm(); },
    onError: (e: any) => toast({ title: t("error"), description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("product_bundles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bundles"] }); toast({ title: t("admin.bundle_deleted") }); },
  });

  const resetForm = () => { setForm({ name: "", description: "" }); setSelectedProducts([]); setEditId(null); setOpen(false); };

  const startEdit = (bundle: any) => {
    setEditId(bundle.id); setForm({ name: bundle.name, description: bundle.description || "" });
    setSelectedProducts(bundle.bundle_products?.map((bp: any) => bp.product_id) || []); setOpen(true);
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/bundle/${id}`);
    toast({ title: t("admin.link_copied"), description: t("bundle.link_copied_desc") });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.bundle_title")}</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> {t("admin.create_bundle")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? t("admin.edit_bundle") : t("admin.new_bundle")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <Input placeholder={t("admin.bundle_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Textarea placeholder={t("admin.bundle_desc")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div>
                <Label className="mb-2 block">{t("admin.select_products")}</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                  {products?.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedProducts.includes(p.id)} onCheckedChange={(checked) => { setSelectedProducts(checked ? [...selectedProducts, p.id] : selectedProducts.filter((id) => id !== p.id)); }} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t("admin.saving") : editId ? t("admin.save_changes") : t("admin.create_bundle")}
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
                  <p className="text-xs text-muted-foreground mt-1">{bundle.bundle_products?.length || 0} {t("admin.products_count")}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(bundle.id)} title={t("admin.copy_link")}><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(bundle)} title={t("admin.edit_bundle")}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(bundle.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {bundles?.length === 0 && <p className="text-center text-muted-foreground py-8">{t("admin.no_bundles")}</p>}
      </div>
    </div>
  );
}
