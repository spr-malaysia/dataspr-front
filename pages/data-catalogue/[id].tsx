import DataCatalogueShow from "@data-catalogue/show";
import { get } from "@lib/api";
import Metadata from "@components/Metadata";
import { SHORT_LANG } from "@lib/constants";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { withi18n } from "@lib/decorators";
import { useTranslation } from "@hooks/useTranslation";
import { DCConfig, DCFilter, FilterDate, OptionType, Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useMemo } from "react";

const CatalogueShow: Page = ({
  meta,
  params,
  config,
  dataset,
  explanation,
  metadata,
  urls,
  translations,
  catalogueId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation(["catalogue", "common"]);

  const availableOptions = useMemo<OptionType[]>(() => {
    switch (dataset.type) {
      case "TABLE":
        return [{ label: t("table"), value: "table" }];

      case "GEOJSON":
      case "HEATTABLE":
        return [{ label: t("chart"), value: "chart" }];

      default:
        return [
          { label: t("chart"), value: "chart" },
          { label: t("table"), value: "table" },
        ];
    }
  }, [dataset.type]);

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={dataset.meta.title}
        description={dataset.meta.desc.replace(/^(.*?)]/, "")}
        keywords={""}
      />
      <DataCatalogueShow
        options={availableOptions}
        params={params}
        config={config}
        dataset={dataset}
        explanation={explanation}
        metadata={metadata}
        urls={urls}
        translations={translations}
        catalogueId={catalogueId}
      />
    </AnalyticsProvider>
  );
};

export const getServerSideProps: GetServerSideProps = withi18n(
  "catalogue",
  async ({ locale, query, params }) => {
    const { data } = await get("/data-variable/", {
      id: params?.id,
      lang: SHORT_LANG[locale as keyof typeof SHORT_LANG],
      ...query,
    });
    const config: DCConfig = {
      context: {},
      dates: null,
      options: null,
      precision: data.API.precision ?? null,
      freeze: data.API.freeze ?? null,
      color: data.API.colour ?? "blues",
      geojson: data.API.file_json ?? null,
      line_variables: data.API.line_variables ?? null,
    };

    const hasTranslations = data.translations && Object.keys(data.translations).length > 0;
    const hasQuery = query && Object.keys(query).length > 1;

    const assignContext = (item: DCFilter) => {
      let [label, value] = ["", ""];
      if (item.key === "date_slider") {
        label = (query[item.key] as string) ?? item.default;
        value = (query[item.key] as string) ?? item.default;
      } else if (!hasTranslations && !hasQuery) {
        label = item.default;
        value = item.default;
      } else if (!hasTranslations && hasQuery) {
        label = query[item.key] as string;
        value = query[item.key] as string;
      } else if (hasTranslations && !hasQuery) {
        label = (data.translations[item.default] as string) ?? item.default;
        value = item.default;
      } else {
        label = data.translations[query[item.key] as string] ?? query[item.key] ?? item.default;
        value = (query[item.key] as string) ?? item.default;
      }

      Object.assign(config.context, { [item.key]: { label, value } });
    };

    data.API.filters?.forEach((item: DCFilter) => {
      if (item.key === "date_slider") config.dates = item as FilterDate;
      assignContext(item);
    });
    config.options =
      data.API.filters?.filter((item: DCFilter) => item.key !== "date_slider") ?? null;

    return {
      props: {
        meta: {
          id: data.chart_details.intro.unique_id,
          type: "data-catalogue",
        },
        config,
        params,
        dataset: {
          type: data.API.chart_type,
          chart: data.chart_details.chart_data ?? {},
          table: data.chart_details.table_data ?? null,
          meta: data.chart_details.intro,
        },
        explanation: data.explanation,
        metadata: {
          url: {
            csv: data.metadata.url.csv ?? null,
            parquet: data.metadata.url.parquet ?? null,
            link_geojson: data.metadata.url.link_geojson ?? null,
          },
          data_as_of: data.metadata.data_as_of,
          last_updated: data.metadata.last_updated,
          next_update: data.metadata.next_update,
          description: data.metadata.dataset_desc,
          source: data.metadata.data_source,
          definitions: data.metadata.out_dataset.concat(data.metadata?.in_dataset ?? []),
        },
        urls: data.downloads ?? {},
        translations: data.translations ?? {},
        catalogueId: params?.id,
      },
    };
  }
);

export default CatalogueShow;