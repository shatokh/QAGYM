import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { appLocales } from "./locales";
import { resources } from "./resources";

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  initAsync: false,
  supportedLngs: appLocales,
  fallbackLng: false,
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});
