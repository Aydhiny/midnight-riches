"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/server/actions/notifications";
import type { Notification } from "@/server/actions/notifications";

const TYPE_ICONS: Record<string, string> = {
  feature: "\u{1F195}", // 🆕
  daily_spin: "\u{1F3B0}", // 🎰
  daily_puzzle: "\u{1F9E9}", // 🧩
  community_win: "\u{1F3C6}", // 🏆
  jackpot: "\u{1F48E}", // 💎
  promotion: "\u{1F381}", // 🎁
  system: "\u{2699}\u{FE0F}", // ⚙️
};

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    const result = await getUnreadCountAction();
    if (result.success) {
      setUnreadCount(result.count);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const result = await getNotificationsAction();
    if (result.success) {
      setNotificationList(result.notifications);
    }
    setLoading(false);
  }, []);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleMarkRead(id: string) {
    const result = await markNotificationReadAction(id);
    if (result.success) {
      setNotificationList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsReadAction();
    if (result.success) {
      setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--glass-border)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 sm:w-96 backdrop-blur-xl"
          style={{ background: "var(--dropdown-bg, rgba(15,5,32,0.96))", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {t("title")}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-amber-500 transition-colors hover:text-amber-400"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notificationList.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
              </div>
            ) : notificationList.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                {t("empty")}
              </div>
            ) : (
              notificationList.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) handleMarkRead(notification.id);
                  }}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    !notification.read
                      ? "bg-amber-500/5"
                      : ""
                  }`}
                >
                  {/* Type icon */}
                  <span className="mt-0.5 flex-shrink-0 text-lg leading-none">
                    {TYPE_ICONS[notification.type] ?? TYPE_ICONS.system}
                  </span>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${
                          !notification.read
                            ? "font-semibold text-[var(--text-primary)]"
                            : "font-medium text-[var(--text-secondary)]"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)] opacity-70">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
