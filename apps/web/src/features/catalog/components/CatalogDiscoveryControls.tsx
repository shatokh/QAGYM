import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogFilterOptionsResponse } from "../api/catalog.contract";
import type { CatalogFilters } from "../catalog.pagination";

interface CatalogDiscoveryControlsProps {
  filters: CatalogFilters;
  options?: CatalogFilterOptionsResponse["data"];
  optionsError: boolean;
  optionsPending: boolean;
  onClear: () => void;
  onSubmit: (filters: CatalogFilters) => void;
}

export function CatalogDiscoveryControls({
  filters,
  options,
  optionsError,
  optionsPending,
  onClear,
  onSubmit,
}: CatalogDiscoveryControlsProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters.availability, filters.genre, filters.q, filters.series]);

  function updateDraft<Key extends keyof CatalogFilters>(
    key: Key,
    value: CatalogFilters[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ ...draft, q: draft.q.trim() });
  }

  function clear() {
    setDraft({ q: "", genre: "", series: "", availability: "" });
    onClear();
  }

  return (
    <form className="catalog-discovery" onSubmit={submit}>
      <div className="catalog-discovery__search">
        <label htmlFor="catalog-search">{t("catalog.searchLabel")}</label>
        <div className="catalog-discovery__search-row">
          <input
            id="catalog-search"
            name="q"
            type="search"
            maxLength={100}
            value={draft.q}
            placeholder={t("catalog.searchPlaceholder")}
            onChange={(event) => updateDraft("q", event.target.value)}
          />
          <button type="submit">{t("catalog.searchAction")}</button>
        </div>
      </div>

      <fieldset disabled={optionsPending || optionsError}>
        <legend>{t("catalog.filtersLegend")}</legend>
        <label>
          <span>{t("catalog.genreLabel")}</span>
          <select
            value={draft.genre}
            onChange={(event) => updateDraft("genre", event.target.value)}
          >
            <option value="">{t("catalog.allGenres")}</option>
            {options?.genres.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{t("catalog.seriesLabel")}</span>
          <select
            value={draft.series}
            onChange={(event) => updateDraft("series", event.target.value)}
          >
            <option value="">{t("catalog.allSeries")}</option>
            {options?.series.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{t("catalog.availabilityLabel")}</span>
          <select
            value={draft.availability}
            onChange={(event) =>
              updateDraft(
                "availability",
                event.target.value as CatalogFilters["availability"],
              )
            }
          >
            <option value="">{t("catalog.anyAvailability")}</option>
            <option value="in-stock">{t("catalog.inStock")}</option>
            <option value="out-of-stock">{t("catalog.outOfStock")}</option>
          </select>
        </label>
      </fieldset>

      {optionsError ? (
        <p className="catalog-discovery__notice" role="status">
          {t("catalog.filterOptionsUnavailable")}
        </p>
      ) : null}

      <button
        className="catalog-discovery__clear"
        type="button"
        disabled={!draft.q && !draft.genre && !draft.series && !draft.availability}
        onClick={clear}
      >
        {t("catalog.clearFilters")}
      </button>
    </form>
  );
}
