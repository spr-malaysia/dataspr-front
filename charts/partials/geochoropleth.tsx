import { CatalogueContext } from "@lib/contexts/catalogue";
import { default as dynamic } from "next/dynamic";
import { FunctionComponent, useContext } from "react";

const GeoChoropleth = dynamic(() => import("../geochoropleth"), {
  ssr: false,
});

interface CatalogueGeoChoroplethProps {
  className?: string;
  config: any;
}

const CatalogueGeoChoropleth: FunctionComponent<CatalogueGeoChoroplethProps> = ({
  className = "h-[350px] w-full lg:h-[450px]",
  config,
}) => {
  const { bind, dataset } = useContext(CatalogueContext);

  return (
    <GeoChoropleth
      _ref={bind.leaflet}
      id={dataset.meta.unique_id}
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

export default CatalogueGeoChoropleth;
