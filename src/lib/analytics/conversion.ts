"use client";

import { useCallback } from "react";

type EventName =
  | "page_load"
  | "cta_click"
  | "demo_spin"
  | "signup_modal_open"
  | "registration_start"
  | "registration_complete"
  | "exit_intent_shown"
  | "section_view";

interface ConversionEvent {
  event: EventName;
  timestamp: number;
  data?: Record<string, unknown>;
}

const STORAGE_KEY = "mr_conversion_events";

function getEvents(): ConversionEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConversionEvent[]) : [];
  } catch {
    return [];
  }
}

function storeEvent(event: ConversionEvent) {
  if (typeof window === "undefined") return;
  try {
    const events = getEvents();
    events.push(event);
    // Keep max 200 events per session
    const trimmed = events.slice(-200);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage quota exceeded or unavailable — silently fail
  }
}

export function trackConversion(
  event: EventName,
  data?: Record<string, unknown>
) {
  storeEvent({
    event,
    timestamp: Date.now(),
    data,
  });
}

export function useConversionTracker() {
  const track = useCallback(
    (event: EventName, data?: Record<string, unknown>) => {
      trackConversion(event, data);
    },
    []
  );

  return { track };
}

export function getConversionEvents(): ConversionEvent[] {
  return getEvents();
}
