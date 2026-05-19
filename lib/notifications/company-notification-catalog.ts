/** Clave: envío de PDF de cotización al cliente (Resend). */
export const NOTIFICATION_KEY_QUOTATION_EMAIL = "quotation_sent" as const;
/** Clave: correo de bienvenida al invitar un usuario a la empresa. */
export const NOTIFICATION_KEY_MEMBER_INVITE_EMAIL = "member_invite" as const;
/** Clave: correo al asignar una orden de trabajo a un trabajador. */
export const NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL = "work_order_assigned" as const;

export type NotificationEmailKey =
  | typeof NOTIFICATION_KEY_QUOTATION_EMAIL
  | typeof NOTIFICATION_KEY_MEMBER_INVITE_EMAIL
  | typeof NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL;

export const NOTIFICATION_EMAIL_CATALOG: ReadonlyArray<{
  key: NotificationEmailKey;
  title: string;
  description: string;
}> = [
  {
    key: NOTIFICATION_KEY_QUOTATION_EMAIL,
    title: "Cotización por correo al cliente",
    description:
      "Cuando alguien envía la cotización en PDF por correo desde la app (Resend). Si lo desactivas, no se podrá enviar hasta que lo vuelvas a activar.",
  },
  {
    key: NOTIFICATION_KEY_MEMBER_INVITE_EMAIL,
    title: "Invitación de usuario a la empresa",
    description:
      "Correo con usuario y contraseña inicial al añadir un miembro nuevo. Si lo desactivas, el alta sigue funcionando pero deberás comunicar las credenciales por otro canal.",
  },
  {
    key: NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL,
    title: "Orden de trabajo asignada",
    description:
      "Correo al trabajador cuando se le asigna una orden de trabajo nueva o se le reasigna una existente.",
  },
];

/** Clave in-app: invitación / asignación a un evento de agenda. */
export const IN_APP_KEY_AGENDA_INVITATION = "agenda_invitation" as const;
/** Clave in-app: pago registrado pendiente de firma del trabajador. */
export const IN_APP_KEY_PAYMENT_PENDING_SIGNATURE = "payment_pending_signature" as const;
/** Clave in-app: orden de trabajo asignada a un trabajador. */
export const IN_APP_KEY_WORK_ORDER_ASSIGNED = "work_order_assigned" as const;

export type NotificationInAppKey =
  | typeof IN_APP_KEY_AGENDA_INVITATION
  | typeof IN_APP_KEY_PAYMENT_PENDING_SIGNATURE
  | typeof IN_APP_KEY_WORK_ORDER_ASSIGNED;

export const NOTIFICATION_IN_APP_CATALOG: ReadonlyArray<{
  key: NotificationInAppKey;
  title: string;
  description: string;
}> = [
  {
    key: IN_APP_KEY_AGENDA_INVITATION,
    title: "Invitaciones a la agenda",
    description: "Aviso en el panel cuando te añaden como asistente a un evento.",
  },
  {
    key: IN_APP_KEY_PAYMENT_PENDING_SIGNATURE,
    title: "Pagos pendientes de firma",
    description: "Aviso cuando se registra un pago a tu nombre y debes confirmarlo.",
  },
  {
    key: IN_APP_KEY_WORK_ORDER_ASSIGNED,
    title: "Órdenes de trabajo asignadas",
    description: "Aviso en el panel cuando te asignan o reasignan una orden de trabajo.",
  },
];

function readBool(map: unknown, key: string): boolean | undefined {
  if (map == null || typeof map !== "object" || Array.isArray(map)) return undefined;
  const v = (map as Record<string, unknown>)[key];
  if (typeof v !== "boolean") return undefined;
  return v;
}

/** Ausente o valor no booleano → se considera activo (comportamiento histórico). */
export function isEmailNotificationEnabled(json: unknown, key: string): boolean {
  const b = readBool(json, key);
  return b !== false;
}

/** Igual que correo: ausente o no booleano → activo. */
export function isInAppNotificationEnabled(json: unknown, key: string): boolean {
  const b = readBool(json, key);
  return b !== false;
}

export function mergeEmailNotificationDefaults(json: unknown): Record<NotificationEmailKey, boolean> {
  return {
    [NOTIFICATION_KEY_QUOTATION_EMAIL]: isEmailNotificationEnabled(
      json,
      NOTIFICATION_KEY_QUOTATION_EMAIL,
    ),
    [NOTIFICATION_KEY_MEMBER_INVITE_EMAIL]: isEmailNotificationEnabled(
      json,
      NOTIFICATION_KEY_MEMBER_INVITE_EMAIL,
    ),
    [NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL]: isEmailNotificationEnabled(
      json,
      NOTIFICATION_KEY_WORK_ORDER_ASSIGNED_EMAIL,
    ),
  };
}

export function mergeInAppNotificationDefaults(
  json: unknown,
): Record<NotificationInAppKey, boolean> {
  const out = {} as Record<NotificationInAppKey, boolean>;
  for (const row of NOTIFICATION_IN_APP_CATALOG) {
    out[row.key] = isInAppNotificationEnabled(json, row.key);
  }
  return out;
}
