import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { getUserLocale } from "./locale";

export default getRequestConfig(async () => {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-next-intl-locale");
  const supported = ["en", "bs"];
  const locale =
    headerLocale && supported.includes(headerLocale)
      ? (headerLocale as "en" | "bs")
      : await getUserLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}/index.json`)).default,
  };
});
