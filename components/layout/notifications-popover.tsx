"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getInAppNotificationsForPanel,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  type InAppNotificationRow,
} from "@/server/actions/in-app-notifications";

export function NotificationsPopover({
  className,
}: Readonly<{
  className?: string;
}>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<InAppNotificationRow[]>([]);

  const refresh = useCallback(async () => {
    const res = await getInAppNotificationsForPanel();
    if (res.ok) {
      setUnreadCount(res.unreadCount);
      setItems(res.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const badgeLabel = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  async function handleOpenItem(n: InAppNotificationRow) {
    if (!n.readAt) {
      const r = await markInAppNotificationRead(n.id);
      if (r.ok) {
        setUnreadCount((c) => Math.max(0, c - 1));
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
          ),
        );
      }
    }
    setOpen(false);
    if (n.href) {
      router.push(n.href);
    }
  }

  async function handleMarkAll() {
    const r = await markAllInAppNotificationsRead();
    if (r.ok) {
      const now = new Date().toISOString();
      setUnreadCount(0);
      setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? now })));
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          className={cn("relative shrink-0", className)}
        >
          <Bell className="size-[1.05rem]" aria-hidden />
          {badgeLabel ? (
            <span
              className="bg-destructive text-white absolute -top-0.5 -right-0.5 flex min-w-[1.1rem] items-center justify-center rounded-full px-[5px] py-0.5 text-[0.6rem] font-semibold leading-none tabular-nums shadow-sm"
         
              aria-hidden
            >
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className={cn(
            "border-border bg-popover text-popover-foreground z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border p-0 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2.5">
            <p className="text-foreground text-sm font-semibold tracking-tight">Notificaciones</p>
            {unreadCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 gap-1 px-2 text-xs"
                onClick={() => void handleMarkAll()}
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Marcar leídas
              </Button>
            ) : null}
          </div>

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
            {loading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Cargando…
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                No hay notificaciones todavía.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {items.map((n) => {
                  const unread = n.readAt == null;
                  const timeAgo = formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: es,
                  });
                  const inner = (
                    <>
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          unread ? "text-foreground font-medium" : "text-foreground/85",
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                          {n.body}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-1 text-[0.65rem]">{timeAgo}</p>
                    </>
                  );

                  if (n.href) {
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          className={cn(
                            "hover:bg-accent/80 block w-full px-3 py-3 text-left transition-colors",
                            unread && "bg-primary/[0.04]",
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            void handleOpenItem(n);
                          }}
                        >
                          {inner}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={cn(
                          "hover:bg-accent/80 w-full px-3 py-3 text-left transition-colors",
                          unread && "bg-primary/[0.04]",
                        )}
                        onClick={() => void handleOpenItem(n)}
                      >
                        {inner}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
