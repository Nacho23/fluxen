import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Calendar,
  ClipboardList,
  Contact,
  FileText,
  Shield,
  Sparkles,
  UserCog,
  Wrench,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Inicio",
  description:
    "Fluxen organiza clientes, cotizaciones, agenda, órdenes y cobros para empresas de servicios técnicos.",
};

const features = [
  {
    icon: Contact,
    title: "Clientes centralizados",
    description:
      "Historial y datos en un solo lugar. Menos idas y vueltas por WhatsApp y hojas sueltas.",
  },
  {
    icon: FileText,
    title: "Cotizaciones claras",
    description:
      "Propuestas ordenadas y seguimiento del estado para cerrar ventas con más tranquilidad.",
  },
  {
    icon: Calendar,
    title: "Agenda compartida",
    description:
      "Visitas y compromisos visibles para el equipo, sin solapamientos ni citas perdidas.",
  },
  {
    icon: ClipboardList,
    title: "Órdenes de trabajo",
    description:
      "Del pedido al cierre: estados visibles para que todos sepan en qué va cada servicio.",
  },
  {
    icon: Banknote,
    title: "Pagos y cobros",
    description:
      "Seguimiento financiero alineado con el trabajo hecho, para cobrar más rápido.",
  },
  {
    icon: UserCog,
    title: "Equipo y roles",
    description:
      "Varias empresas, permisos por rol y propietarios que definen quién hace qué.",
  },
] as const;

const steps = [
  {
    n: "1",
    title: "Entra y crea tu empresa",
    text: "Inicia sesión, nombra tu negocio y empieza a usar el panel en minutos.",
  },
  {
    n: "2",
    title: "Invita al equipo",
    text: "Añade operadores con el rol que corresponda a cada uno.",
  },
  {
    n: "3",
    title: "Opera con orden",
    text: "Clientes, cotizaciones y órdenes quedan asociados a esa empresa.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <header className="border-border/70 bg-background/70 supports-[backdrop-filter]:bg-background/55 sticky top-0 z-20 border-b shadow-[0_1px_0_oklch(0.5_0.02_270_/_0.04)] shadow-[0_8px_32px_-12px_oklch(0.35_0.08_196_/_0.12)] backdrop-blur-xl dark:shadow-[0_8px_40px_-16px_oklch(0_0_0_/_0.35)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="text-foreground group flex items-center gap-2.5 font-semibold tracking-tight"
          >
            <span className="bg-primary/15 text-primary ring-primary/25 shadow-primary/15 flex size-9 items-center justify-center rounded-xl shadow-md ring-1 transition-[transform,box-shadow] duration-300 group-hover:scale-[1.03] group-hover:shadow-lg group-hover:shadow-primary/20">
              <Wrench className="size-[1.125rem]" aria-hidden />
            </span>
            <span className="text-[0.95rem]">Fluxen</span>
          </Link>
          <nav
            className="text-muted-foreground hidden items-center gap-8 text-sm font-medium md:flex"
            aria-label="Secciones"
          >
            <a
              href="#beneficios"
              className="hover:text-foreground transition-colors duration-200"
            >
              Beneficios
            </a>
            <a
              href="#como-funciona"
              className="hover:text-foreground transition-colors duration-200"
            >
              Cómo funciona
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="icon" />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" className="shadow-md shadow-primary/25" asChild>
              <Link href="/login" className="gap-1.5">
                Entrar
                <ArrowRight className="size-3.5 opacity-90" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative isolate overflow-hidden pb-20 pt-14 md:pb-28 md:pt-20">
          {/* Capas de fondo: color → malla → rayas → puntos → halos */}
          <div className="landing-hero-canvas absolute inset-0 -z-30" aria-hidden />
          <div className="landing-hero-mesh absolute inset-0 -z-[26]" aria-hidden />
          <div className="landing-hero-stripes absolute inset-0 -z-[24]" aria-hidden />
          <div className="landing-grid-dots absolute inset-0 -z-[22] opacity-[0.85] dark:opacity-90" aria-hidden />
          <div
            className="animate-landing-float bg-primary/35 dark:bg-primary/40 pointer-events-none absolute -left-[18%] top-[2%] -z-20 h-[min(95vw,26rem)] w-[min(95vw,26rem)] rounded-full blur-[110px]"
            aria-hidden
          />
          <div
            className="animate-landing-float-delayed bg-primary/22 dark:bg-primary/30 pointer-events-none absolute -right-[12%] bottom-[-5%] -z-20 h-[min(90vw,28rem)] w-[min(90vw,28rem)] rounded-full blur-[115px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-[20%] -right-[8%] -z-20 h-[min(70vw,18rem)] w-[min(70vw,18rem)] rounded-full bg-[oklch(0.62_0.15_298_/_0.26)] blur-[90px] dark:bg-[oklch(0.5_0.14_300_/_0.38)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-[45%] -left-[5%] -z-20 h-[min(55vw,14rem)] w-[min(55vw,14rem)] rounded-full bg-[oklch(0.58_0.1_205_/_0.2)] blur-[80px] dark:bg-[oklch(0.4_0.1_200_/_0.28)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-[8%] left-[22%] -z-20 h-[min(50vw,15rem)] w-[min(62vw,20rem)] rounded-full bg-[oklch(0.68_0.11_295_/_0.16)] blur-[100px] dark:bg-[oklch(0.42_0.13_290_/_0.32)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 -z-[16] h-48 bg-gradient-to-t from-background via-background/75 to-transparent md:h-56"
            aria-hidden
          />

          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              <span className="border-border/80 bg-card/90 text-foreground shadow-primary/10 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide shadow-md ring-1 ring-primary/15 backdrop-blur-md">
                <Sparkles className="text-primary size-3.5" aria-hidden />
                Servicios técnicos
              </span>
              <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
                Multi-empresa
              </span>
            </div>

            <h1 className="text-foreground mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-tight md:text-5xl md:leading-[1.1] lg:text-[3.15rem]">
              <span className="text-gradient-hero">Operación ordenada</span>
              <span className="mt-2 block">de la solicitud al cobro</span>
            </h1>

            <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-pretty text-base leading-relaxed md:text-lg">
              Una plataforma para empresas de mantenimiento y servicio en terreno: clientes,
              cotizaciones, agenda, órdenes y pagos en un solo lugar. Menos caos en chats y
              planillas, más claridad para tu equipo.
            </p>

            <div
              className="mt-10 h-px w-32 bg-[linear-gradient(90deg,transparent,oklch(0.52_0.14_196_/_0.55),oklch(0.52_0.14_298_/_0.5),transparent)] md:w-40"
              aria-hidden
            />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-11 rounded-xl px-8 shadow-lg shadow-primary/30 transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:shadow-primary/35"
                asChild
              >
                <Link href="/login" className="gap-2">
                  Empezar ahora
                  <ArrowRight className="size-4 opacity-90" aria-hidden />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border/90 bg-card/90 hover:bg-muted/95 hover:border-primary/25 h-11 rounded-xl border-2 px-8 shadow-md backdrop-blur-sm transition-colors duration-300"
                asChild
              >
                <Link href="/dashboard">Ir al panel</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-8 flex items-center justify-center gap-2 text-xs">
              <Shield className="text-primary/80 size-3.5 shrink-0" aria-hidden />
              Acceso con usuario y contraseña. Tus datos quedan aislados por empresa.
            </p>
          </div>
        </section>

        <section
          id="beneficios"
          className="border-border/80 relative border-y bg-gradient-to-b from-muted/50 via-muted/30 to-background py-16 sm:py-20"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.5_0.12_196_/_0.06),transparent_65%),radial-gradient(ellipse_60%_40%_at_85%_15%,oklch(0.52_0.1_300_/_0.07),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.55_0.14_195_/_0.1),transparent_65%),radial-gradient(ellipse_55%_45%_at_88%_12%,oklch(0.48_0.12_295_/_0.14),transparent_58%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                Todo lo que necesitas para el día a día
              </h2>
              <p className="text-muted-foreground mt-3 text-pretty text-sm leading-relaxed md:text-base">
                Diseñado para cuadrillas, talleres y empresas que viven de visitas, presupuestos
                y cobros alineados al trabajo realizado.
              </p>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="border-border/90 bg-card/95 text-card-foreground group relative overflow-hidden rounded-2xl border p-6 shadow-md transition-[transform,box-shadow,border-color] duration-300 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-transparent before:via-primary/90 before:to-transparent hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/[0.08] dark:bg-card/90"
                >
                  <div className="bg-primary/12 text-primary ring-primary/20 shadow-inner mb-4 inline-flex size-11 items-center justify-center rounded-xl shadow-sm ring-1 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="text-foreground font-semibold tracking-tight">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="como-funciona"
          className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-[min(100%,48rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,oklch(0.5_0.1_196_/_0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.14_195_/_0.14),transparent_72%)]"
            aria-hidden
          />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Cómo funciona
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
              Tres pasos para pasar del desorden a un flujo que el equipo puede seguir.
            </p>
          </div>

          <div className="relative mx-auto mt-12 max-w-4xl">
            <div
              className="via-primary/40 pointer-events-none absolute top-[1.375rem] right-8 left-8 z-0 hidden h-px bg-gradient-to-r from-transparent to-transparent md:block dark:via-primary/50"
              aria-hidden
            />
            <ol className="relative z-10 grid gap-6 md:grid-cols-3 md:gap-5">
            {steps.map(({ n, title, text }) => (
              <li
                key={n}
                className="border-border/80 bg-card/80 relative rounded-2xl border p-6 text-center shadow-sm ring-1 ring-primary/[0.06] backdrop-blur-[2px] transition-shadow duration-300 hover:shadow-lg hover:ring-primary/15 md:text-left"
              >
                <div className="bg-primary text-primary-foreground shadow-primary/35 ring-primary/30 mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl text-sm font-bold shadow-lg ring-2 md:mx-0">
                  {n}
                </div>
                <h3 className="text-foreground font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
            </ol>
          </div>

          <div className="mt-14 flex justify-center">
            <Button
              size="lg"
              className="h-11 rounded-xl px-10 shadow-lg shadow-primary/25"
              asChild
            >
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </section>

        <section className="border-primary/20 relative overflow-hidden border-t py-14">
          <div className="landing-cta-glow absolute inset-0 -z-10" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/90 via-transparent to-background/90"
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
              ¿Listo para ordenar tu operación?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed md:text-base">
              Entra con tu equipo y lleva clientes, cotizaciones y órdenes al mismo ritmo.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="h-11 rounded-xl px-8 shadow-lg shadow-primary/25" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-border/80 bg-card/95 hover:bg-card h-11 rounded-xl border-2 px-8 shadow-md backdrop-blur-sm"
                asChild
              >
                <Link href="/dashboard">Abrir el panel</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border/80 bg-background/95 mt-auto border-t py-10 shadow-[0_-4px_24px_-12px_oklch(0.35_0.06_196_/_0.08)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <Link href="/" className="text-muted-foreground flex items-center gap-2 text-sm">
            <Wrench className="text-primary size-4" aria-hidden />
            <span className="font-medium text-foreground">Fluxen</span>
            <span className="text-muted-foreground/80">© {new Date().getFullYear()}</span>
          </Link>
          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/login" className="hover:text-foreground transition-colors duration-200">
              Acceso
            </Link>
            <a href="#beneficios" className="hover:text-foreground transition-colors duration-200">
              Beneficios
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
