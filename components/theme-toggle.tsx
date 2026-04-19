"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@wrksz/themes/client";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  variant = "icon",
}: Readonly<{
  className?: string;
  /** icon: solo botón; labeled: texto en sm+ */
  variant?: "icon" | "labeled";
}>) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "border-border bg-background/80 size-9 shrink-0 shadow-sm backdrop-blur-sm",
          variant === "labeled" && "sm:size-auto sm:min-w-0 sm:gap-2 sm:px-3",
          className,
        )}
        aria-hidden
        disabled
      >
        <Sun className="size-4 opacity-40" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={variant === "labeled" ? "sm" : "icon"}
      className={cn(
        "border-border bg-background/80 hover:bg-muted/90 shadow-sm backdrop-blur-sm",
        variant === "icon" && "size-9",
        variant === "labeled" &&
          "text-muted-foreground hover:text-foreground h-9 gap-2 px-3 sm:min-w-[7.5rem]",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
    >
      {isDark ? (
        <Sun className="text-primary size-4 shrink-0" />
      ) : (
        <Moon className="text-primary size-4 shrink-0" />
      )}
      {variant === "labeled" ? (
        <span className="hidden text-xs font-medium sm:inline">
          {isDark ? "Modo claro" : "Modo oscuro"}
        </span>
      ) : null}
    </Button>
  );
}
