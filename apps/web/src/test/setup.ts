import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { i18n } from "../i18n/i18n";

afterEach(async () => {
  cleanup();
  document.documentElement.lang = "en";
  document.title = "QA Comics Gym";
  await i18n.changeLanguage("en");
});
