import { Navbar } from "@/components/shared/navbar";
import { WalletSyncWrapper } from "./wallet-sync-wrapper";

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
    </div>
  );
}
