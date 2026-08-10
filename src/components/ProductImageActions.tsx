import { MoreVertical, Eye, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { getProductShareUrl } from "@/lib/share";

interface ProductImageActionsProps {
  productId: string;
  className?: string;
}

export function ProductImageActions({ productId, className }: ProductImageActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const share = async (e: React.MouseEvent) => {
    stop(e);
    const url = getProductShareUrl(productId);
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
    } catch {
      /* user cancelled or unsupported — fall back to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("product.link_copied"), description: t("product.link_copied_desc") });
    } catch {
      toast({ title: t("product.link_copied"), description: url });
    }
  };

  return (
    <div className={`absolute top-2 right-2 z-10 ${className ?? ""}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("actions.more")}
            onClick={stop}
            className="rounded-full bg-background/80 backdrop-blur border p-1.5 shadow-sm hover:bg-background transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50">
          <DropdownMenuItem
            onClick={(e) => {
              stop(e as unknown as React.MouseEvent);
              navigate(`/product/${productId}`);
            }}
          >
            <Eye className="h-4 w-4 mr-2" /> {t("actions.view")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => share(e as unknown as React.MouseEvent)}>
            <Share2 className="h-4 w-4 mr-2" /> {t("actions.share")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
