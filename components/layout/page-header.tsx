export function PageHeader({
  title,
  description,
}: Readonly<{
  title: string;
  description?: string;
}>) {
  return (
    <header className="space-y-1.5">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>
      ) : null}
    </header>
  );
}
