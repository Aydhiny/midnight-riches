"use client";

import dynamic from "next/dynamic";

const SlotMachine = dynamic(
  () => import("@/components/game/slot-machine").then((mod) => mod.SlotMachine),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
      </div>
    ),
  }
);

export default function GamePage() {
  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <SlotMachine />
    </div>
  );
}
