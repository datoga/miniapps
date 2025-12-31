import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { mergeMessages } from "@miniapps/i18n";

const locales = ["es", "en"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !hasLocale(locales, locale)) {
    locale = "es";
  }

  const commonMessages = (
    await import(`@miniapps/i18n/messages/common/${locale}.json`)
  ).default;

  const appMessages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: mergeMessages(commonMessages, appMessages),
  };
});

