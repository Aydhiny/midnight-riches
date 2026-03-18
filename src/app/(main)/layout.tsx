import { Navbar } from "@/components/shared/navbar";
import { WalletSyncWrapper } from "./wallet-sync-wrapper";
import { Toaster } from "sonner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <WalletSyncWrapper />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        toastOptions={{
          style: { background: "#0f0520", border: "1px solid rgba(255,255,255,0.08)" }
        }}
      />
    </div>
  );
}
