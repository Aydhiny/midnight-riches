import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond, Bebas_Neue } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SessionProvider } from "@/components/shared/session-provider";
import { CookieConsent } from "@/components/shared/cookie-consent";
import "@/styles/globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://midnightriches.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = await getLocale();

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: t("title"),
      template: "%s | Midnight Riches",
    },
    description: t("description"),
    keywords: [
      "slot machine", "fruit slots", "free slots", "online casino", "free credits",
      "megaways", "classic slots", "provably fair", "midnight riches", "casino game",
    ],
    authors: [{ name: "Midnight Riches" }],
    creator: "Midnight Riches",
    publisher: "Midnight Riches",
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      locale: locale === "bs" ? "bs_BA" : "en_US",
      alternateLocale: locale === "bs" ? ["en_US"] : ["bs_BA"],
      url: BASE_URL,
      siteName: "Midnight Riches",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Midnight Riches — Premium Slot Machine",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/og-image.png"],
      creator: "@midnightriches",
    },
    alternates: {
      canonical: BASE_URL,
      languages: {
        en: `${BASE_URL}/en`,
        bs: `${BASE_URL}/bs`,
      },
    },
    icons: {
      icon: "/logo.svg",
      apple: "/logo.svg",
    },
    manifest: "/site.webmanifest",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${cormorant.variable} ${bebasNeue.variable}`}
    >
      <head>
        <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en`} />
        <link rel="alternate" hrefLang="bs" href={`${BASE_URL}/bs`} />
        <link rel="alternate" hrefLang="x-default" href={BASE_URL} />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
