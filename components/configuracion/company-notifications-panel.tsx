"use client";

import { Bell, Loader2, Mail } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  NOTIFICATION_EMAIL_CATALOG,
  NOTIFICATION_IN_APP_CATALOG,
  type NotificationEmailKey,
  type NotificationInAppKey,
} from "@/lib/notifications/company-notification-catalog";
import { updateCompanyNotificationSettings } from "@/server/actions/company-notifications";

export function CompanyNotificationsPanel({
  emailDefaults,
  inAppDefaults,
  canSave,
}: Readonly<{
  emailDefaults: Record<NotificationEmailKey, boolean>;
  inAppDefaults: Record<NotificationInAppKey, boolean>;
  canSave: boolean;
}>) {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const res = await updateCompanyNotificationSettings(null, formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await update();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-border bg-card/70 w-full max-w-2xl rounded-2xl border p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="bg-primary/12 text-primary ring-primary/18 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
          <Bell className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-foreground font-semibold tracking-tight">Notificaciones</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Define qué avisos puede enviar la empresa por correo y qué avisos aparecen en el panel
            para los miembros.
          </p>
        </div>
      </div>

      <form action={onSave} className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <h3 className="text-foreground text-sm font-semibold">Correo electrónico</h3>
          </div>
          <ul className="space-y-3">
            {NOTIFICATION_EMAIL_CATALOG.map((row) => (
              <li
                key={row.key}
                className="border-border bg-muted/25 flex flex-col gap-2 rounded-xl border px-4 py-3"
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name={`email_${row.key}`}
                    value="on"
                    defaultChecked={emailDefaults[row.key]}
                    disabled={pending || !canSave}
                    className="border-input text-primary mt-0.5 size-4 shrink-0 rounded"
                  />
                  <span>
                    <span className="text-foreground block text-sm font-medium">{row.title}</span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                      {row.description}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Bell className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <h3 className="text-foreground text-sm font-semibold">En el sistema (panel)</h3>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Si desactivas un tipo, no se crearán notificaciones nuevas de ese evento para nadie en
            la empresa.
          </p>
          <ul className="space-y-3">
            {NOTIFICATION_IN_APP_CATALOG.map((row) => (
              <li
                key={row.key}
                className="border-border bg-muted/25 flex flex-col gap-2 rounded-xl border px-4 py-3"
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name={`inapp_${row.key}`}
                    value="on"
                    defaultChecked={inAppDefaults[row.key]}
                    disabled={pending || !canSave}
                    className="border-input text-primary mt-0.5 size-4 shrink-0 rounded"
                  />
                  <span>
                    <span className="text-foreground block text-sm font-medium">{row.title}</span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                      {row.description}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {canSave ? (
          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Guardando…
              </>
            ) : (
              "Guardar preferencias de notificación"
            )}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Solo quien tenga permiso de edición en el módulo «Notificaciones» puede cambiar estas
            opciones (consulta al propietario o revisa la matriz de permisos).
          </p>
        )}
      </form>
    </section>
  );
}
