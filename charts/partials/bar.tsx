import { DownloadOptions } from "@lib/types";
import { toast } from "@components/Toast";
import { WindowContext } from "@lib/contexts/window";
import { useAnalytics } from "@hooks/useAnalytics";
import { useTranslation } from "@hooks/useTranslation";
import { useWatch } from "@hooks/useWatch";
import { BREAKPOINTS, CATALOGUE_COLORS } from "@lib/constants";
import { clx, download, exportAs } from "@lib/helpers";
import { CloudArrowDownIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { ChartDataset } from "chart.js";
import { default as dynamic } from "next/dynamic";
import { FunctionComponent, useContext, useMemo, useState } from "react";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

const Bar = dynamic(() => import("../bar"), { ssr: false });

interface CatalogueBarProps {
  className?: string;
  config: any;
  dataset: any;
  urls: {
    [key: string]: string;
  };
  onDownload?: (prop: DownloadOptions) => void;
  translations: Record<string, string>;
}

const CatalogueBar: FunctionComponent<CatalogueBarProps> = ({
  className,
  config,
  dataset,
  urls,
  translations,
  onDownload,
}) => {
  const { t } = useTranslation(["catalogue", "common"]);
  const [ctx, setCtx] = useState<ChartJSOrUndefined<"bar", any[], unknown> | null>(null);
  const { size } = useContext(WindowContext);
  const { track } = useAnalytics(dataset);
  const bar_layout = useMemo<"horizontal" | "vertical">(() => {
    if (dataset.type === "HBAR" || size.width < BREAKPOINTS.MD) return "horizontal";

    return "vertical";
  }, [dataset.type, size.width]);

  const availableDownloads = useMemo<DownloadOptions>(() => {
    return {
      chart: [
        {
          id: "png",
          image: ctx && ctx.toBase64Image("png", 1),
          title: t("image.title"),
          description: t("image.desc"),
          icon: <CloudArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />,
          href: () => {
            download(ctx!.toBase64Image("png", 1), dataset.meta.unique_id.concat(".png"));
            track("png");
          },
        },
        {
          id: "svg",
          image: ctx && ctx.toBase64Image("image/png", 1),
          title: t("vector.title"),
          description: t("vector.desc"),
          icon: <CloudArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />,
          href: () => {
            exportAs("svg", ctx!.canvas)
              .then(dataUrl => download(dataUrl, dataset.meta.unique_id.concat(".svg")))
              .then(() => track("svg"))
              .catch(e => {
                toast.error(
                  t("common:error.toast.image_download_failure"),
                  t("common:error.toast.try_again")
                );
                console.error(e);
              });
          },
        },
      ],
      data: [
        {
          id: "csv",
          image: "/static/images/icons/csv.png",
          title: t("csv.title"),
          description: t("csv.desc"),
          icon: <DocumentArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />,
          href: () => {
            download(urls.csv, dataset.meta.unique_id.concat(".csv"));
            track("csv");
          },
        },
        {
          id: "parquet",
          image: "/static/images/icons/parquet.png",
          title: t("parquet.title"),
          description: t("parquet.desc"),
          icon: <DocumentArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />,
          href: () => {
            download(urls.parquet, dataset.meta.unique_id.concat(".parquet"));
            track("parquet");
          },
        },
      ],
    };
  }, [ctx]);

  const _datasets = useMemo<ChartDataset<"bar", any[]>[]>(() => {
    const sets = Object.entries(dataset.chart).filter(([key, _]) => key !== "x");

    return sets.map(([key, y], index) => ({
      data: y as number[],
      label: sets.length === 1 ? dataset.meta.title : translations[key] ?? key,
      borderColor: CATALOGUE_COLORS[index],
      backgroundColor: CATALOGUE_COLORS[index].concat("1A"),
      borderWidth: 1,
    }));
  }, [dataset.chart]);

  useWatch(() => {
    if (onDownload) onDownload(availableDownloads);
  }, [dataset.chart.x, ctx]);

  return (
    <Bar
      _ref={ref => setCtx(ref)}
      className={clx(
        className
          ? className
          : bar_layout === "vertical"
          ? "h-[350px] w-full lg:h-[450px]"
          : "mx-auto h-[500px] w-full lg:h-[600px] lg:w-3/4"
      )}
      type="category"
      enableStack={dataset.type === "STACKED_BAR"}
      layout={bar_layout}
      enableGridX={bar_layout !== "vertical"}
      enableGridY={bar_layout === "vertical"}
      enableLegend={_datasets.length > 1}
      precision={config?.precision !== undefined ? [config.precision, config.precision] : [1, 1]}
      data={{
        labels: dataset.chart.x,
        datasets: _datasets,
      }}
    />
  );
};

export default CatalogueBar;
