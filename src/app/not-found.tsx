import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <div className="text-6xl">🎰</div>
          <h2 className="mt-4 text-6xl font-black text-yellow-400">404</h2>
          <p className="mt-2 text-purple-300/70">
            This page hit the jackpot of not existing.
          </p>
          <div className="mt-6">
            <Link href="/">
              <Button variant="gold" size="lg">
                Back to Lobby
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
