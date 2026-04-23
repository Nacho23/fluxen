import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ConfiguracionSubpageBack() {
  return (
    <Link
      href="/configuracion"
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors"
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      Volver a configuración
    </Link>
  );
}
