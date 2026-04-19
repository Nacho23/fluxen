import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_70%_at_50%_-25%,oklch(0.5_0.02_270_/_0.07),transparent_58%)]"
        aria-hidden
      />
      <div className="absolute right-4 top-4 z-20 md:right-8 md:top-8">
        <ThemeToggle variant="labeled" />
      </div>
      {children}
    </div>
  );
}
