import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BrandName } from "@/components/BrandName";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <BrandName className="text-primary" /> © {new Date().getFullYear()} — Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}
