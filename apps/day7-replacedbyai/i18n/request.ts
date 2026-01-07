import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { mergeMessages } from "@miniapps/i18n";

const locales = ["es", "en"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !hasLocale(locales, locale)) {
    locale = "en";
  }

  // Load common messages
  const commonMessages = (await import(`@miniapps/i18n/messages/common/${locale}.json`)).default;

  // Load app-specific messages
  const appMessages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: mergeMessages(commonMessages, appMessages),
  };
});


