import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function BrandName({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/admin-login");
      }
    }
  };

  return (
    <span
      onClick={handleClick}
      className={`font-bold cursor-default select-none ${className}`}
      title="Salud=Felicidad();"
    >
      Salud=Felicidad();
    </span>
  );
}
