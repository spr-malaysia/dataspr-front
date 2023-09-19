import { DownloadOptions } from "@lib/types";
import { toast } from "@components/Toast";
import { useAnalytics } from "@hooks/useAnalytics";
import { useTranslation } from "@hooks/useTranslation";
import { useWatch } from "@hooks/useWatch";
import { CATALOGUE_COLORS } from "@lib/constants";
import { download, exportAs } from "@lib/helpers";
import { CloudArrowDownIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { ChartDataset } from "chart.js";
import { default as dynamic } from "next/dynamic";
import { FunctionComponent, useMemo, useState } from "react";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

const Scatter = dynamic(() => import("../scatter"), { ssr: false });

interface CatalogueScatterProps {
  className?: string;
  dataset: any;
  translations: any;
  urls: {
    [key: string]: string;
  };
  onDownload?: (prop: DownloadOptions) => void;
}

const CatalogueScatter: FunctionComponent<CatalogueScatterProps> = ({
  className = "mx-auto aspect-square w-full lg:h-[512px] lg:w-1/2",
  translations,
  dataset,
  urls,
  onDownload,
}) => {
  const { t } = useTranslation(["catalogue", "common"]);
  const [ctx, setCtx] = useState<ChartJSOrUndefined<"scatter", any[], unknown> | null>(null);
  const { track } = useAnalytics(dataset);

  const availableDownloads = useMemo<DownloadOptions>(
    () => ({
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
                  t("common:toast.image_download_failure"),
                  t("common:toast.try_again")
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
    }),
    [ctx]
  );

  const _datasets = useMemo<ChartDataset<"scatter", any[]>[]>(() => {
    return dataset.chart.map((item: any, index: number) => ({
      type: "line",
      data: item.data,
      label: translations[item.label] ?? item.label,
      borderColor: CATALOGUE_COLORS[index],
      backgroundColor: CATALOGUE_COLORS[index],
      borderWidth: 0,
    }));
  }, [dataset.chart]);

  useWatch(() => {
    if (onDownload) onDownload(availableDownloads);
  }, [dataset.chart, ctx]);

  return (
    <Scatter
      _ref={ref => setCtx(ref)}
      className={className}
      data={_datasets}
      enableRegression
      enableLegend
    />
  );
};

export default CatalogueScatter;
