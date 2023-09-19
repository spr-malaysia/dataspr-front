import { DownloadOptions } from "@lib/types";
import { toast } from "@components/Toast";
import { useAnalytics } from "@hooks/useAnalytics";
import { useTranslation } from "@hooks/useTranslation";
import { download, exportAs } from "@lib/helpers";
import {
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { default as dynamic } from "next/dynamic";
import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

const Choropleth = dynamic(() => import("../choropleth"), {
  ssr: false,
});

interface CatalogueChoroplethProps {
  className?: string;
  config: any;
  dataset: any;
  urls: {
    [key: string]: string;
  };
  onDownload?: (prop: DownloadOptions) => void;
}

const CatalogueChoropleth: FunctionComponent<CatalogueChoroplethProps> = ({
  className = "h-[350px] w-full lg:h-[450px]",
  dataset,
  config,
  urls,
  onDownload,
}) => {
  const { t } = useTranslation(["catalogue", "common"]);
  const { track } = useAnalytics(dataset);

  const [ctx, setCtx] = useState<ChartJSOrUndefined<
    "choropleth",
    any[],
    unknown
  > | null>(null);
  useEffect(() => {
    if (onDownload) onDownload(availableDownloads);
  }, [ctx]);

  const availableDownloads = useMemo<DownloadOptions>(() => {
    return {
      chart: [
        {
          id: "png",
          image: ctx && ctx.toBase64Image("png", 1),
          title: t("image.title"),
          description: t("image.desc"),
          icon: (
            <CloudArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />
          ),
          href: () => {
            download(
              ctx!.toBase64Image("png", 1),
              dataset.meta.unique_id.concat(".png")
            );
            track("png");
          },
        },
        {
          id: "svg",
          image: ctx && ctx.toBase64Image("png", 1),
          title: t("vector.title"),
          description: t("vector.desc"),
          icon: (
            <CloudArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />
          ),
          href: () => {
            exportAs("svg", ctx!.canvas)
              .then((dataUrl) =>
                download(dataUrl, dataset.meta.unique_id.concat(".svg"))
              )
              .then(() => track("svg"))
              .catch((e) => {
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
          icon: (
            <DocumentArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />
          ),
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
          icon: (
            <DocumentArrowDownIcon className="text-zinc-500 h-6 min-w-[24px]" />
          ),
          href: () => {
            download(urls.parquet, dataset.meta.unique_id.concat(".parquet"));
            track("parquet");
          },
        },
      ],
    };
  }, [ctx]);

  return (
    <Choropleth
      _ref={(_ref) => setCtx(_ref)}
      className={className}
      data={{
        labels: dataset.chart.x,
        values: dataset.chart.y,
      }}
      color={config.color}
      type={config.geojson}
    />
  );
};

export default CatalogueChoropleth;