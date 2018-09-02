import I18n from "react-native-i18n";
import moment from "moment";

// Import all locales
import * as en from "../../resources/locales/en.json";

// Should the app fallback to English if user locale doesn't exists
I18n.defaultLocale = "en";
I18n.fallbacks = true;

// Define the supported translations
I18n.translations = { en };

const currentLocale = I18n.currentLocale();

// Localizing momentjs
moment.locale(currentLocale);

// The method we'll use instead of a regular string
export function localeString(name: string, params = {}) {
  return I18n.t(name, params);
}

export function getCurrentLanguage() {
  const usedLocale = I18n.locales
    .default()
    .find(l => Object.keys(I18n.translations).indexOf(l) > -1);
  return usedLocale || I18n.defaultLocale;
}

export function getDefaultLanguage() {
  return I18n.defaultLocale;
}

export function updateLanguage(language: string) {
  I18n.locale = language;
}

export default I18n;
