import { TableConfig } from "@charts/table";
import LeftRightCard from "@components/LeftRightCard";
import { List, Panel, default as Tabs } from "@components/Tabs";
import { OverallSeat } from "@dashboards/types";
import { MapIcon, TableCellsIcon } from "@heroicons/react/24/solid";
import { useData } from "@hooks/useData";
import { useTranslation } from "@hooks/useTranslation";
import dynamic from "next/dynamic";
import { FunctionComponent } from "react";

/**
 * Election Explorer - Election Analysis
 * @overview Status: In-development
 */

const Table = dynamic(() => import("@charts/table"), {
  ssr: false,
});
const Choropleth = dynamic(() => import("@charts/choropleth"), { ssr: false });

type Analysis = {
  seat: string;
  state?: string;
  party: string;
  majority: {
    abs: number;
    perc: number;
  };
  voter_turnout: {
    abs: number;
    perc: number;
  };
  votes_rejected: {
    abs: number;
    perc: number;
  };
};

interface ElectionAnalysisProps {
  index: number;
  seats: OverallSeat[];
  state: string;
}

const ElectionAnalysis: FunctionComponent<ElectionAnalysisProps> = ({
  index,
  seats,
  state,
}) => {
  const { t } = useTranslation(["common", "elections"]);

  const config: TableConfig[] = [
    {
      accessorKey: "seat",
      id: "constituency",
      header: t("constituency"),
      className: "w-[150px] max-sm:truncate sm:w-[200px]",
    },
    {
      accessorKey: "state",
      id: "state",
      header: t("state"),
      className: "w-[150px]",
    },
    {
      accessorKey: "majority.abs",
      id: "majority.abs",
      header: t("majority"),
    },
    {
      accessorKey: "majority.perc",
      id: "majority.perc",
      header: t("majority_%"),
    },
    {
      accessorKey: "voter_turnout.abs",
      id: "voter_turnout.abs",
      header: t("voter_turnout"),
    },
    {
      accessorKey: "voter_turnout.perc",
      id: "voter_turnout.perc",
      header: t("voter_turnout_%"),
    },
    {
      accessorKey: "votes_rejected.abs",
      id: "votes_rejected.abs",
      header: t("rejected_votes"),
    },
    {
      accessorKey: "votes_rejected.perc",
      id: "votes_rejected.perc",
      header: t("rejected_votes_%"),
    },
  ];

  const analysisData: Array<Analysis> = seats.map((seat) => {
    const matches = seat.seat.split(", ");
    return {
      seat: matches[0],
      state: matches[1],
      party: seat.party,
      majority: {
        abs: seat.majority.abs,
        perc: seat.majority.perc,
      },
      voter_turnout: {
        abs: seat.voter_turnout.abs,
        perc: seat.voter_turnout.perc,
      },
      votes_rejected: {
        abs: seat.votes_rejected.abs,
        perc: seat.votes_rejected.perc,
      },
    };
  });

  const { data, setData } = useData({
    tab_index: 0,
    loading: false,
  });

  return (
    <div className="grid grid-cols-12 py-8 lg:py-12">
      <div className="col-span-full col-start-1 xl:col-span-10 xl:col-start-2">
        <h4 className="text-center">{t("header_3", { ns: "elections" })}</h4>
        <div className="flex justify-end py-3 lg:py-6">
          <List
            options={[
              t("table", { ns: "elections" }),
              t("map", { ns: "elections" }),
            ]}
            icons={[
              <TableCellsIcon key="table_cell_icon" className="mr-1 h-5 w-5" />,
              <MapIcon key="map_icon" className="mr-1 h-5 w-5" />,
            ]}
            current={data.tab_index}
            onChange={(index) => setData("tab_index", index)}
          />
        </div>
        <Tabs hidden current={data.tab_index}>
          <Panel
            name={t("table", { ns: "elections" })}
            icon={<TableCellsIcon className="mr-1 h-5 w-5" />}
          >
            <Table
              className="table-sticky-header"
              data={analysisData}
              enablePagination={10}
              config={
                state !== "mys"
                  ? config.filter((col) => col.id !== "state")
                  : config
              }
              freeze={["constituency"]}
              precision={{
                default: 0,
                columns: {
                  "majority.perc": 1,
                  "voter_turnout.perc": 1,
                  "votes_rejected.perc": 1,
                },
              }}
            />
          </Panel>
          <Panel
            name={t("map", { ns: "elections" })}
            icon={<MapIcon className="mr-1 h-5 w-5" />}
          >
            <LeftRightCard
              left={
                <div className="flex h-full w-full flex-col space-y-6 p-8">
                  <div className="flex flex-col gap-2">
                    <h4>
                      {t("choro_header", {
                        ns: "elections",
                        // stat: t(""),
                      })}
                    </h4>
                    <span className="text-zinc-500 text-sm">
                      {/* {t("data_of", { date: choropleth.data_as_of })} */}
                    </span>
                  </div>
                  <div className="flex grow flex-col justify-between space-y-6">
                    <div className="space-y-3 pt-6">
                      <p className="font-bold">
                        {t("choro_rank", { ns: "elections" })}
                      </p>
                    </div>
                  </div>
                </div>
              }
              right={
                <Choropleth
                  className="h-[400px] w-auto lg:h-[500px]"
                  type={index === 1 ? "dun" : "parlimen"}
                />
              }
            />
          </Panel>
        </Tabs>
      </div>
    </div>
  );
};

export default ElectionAnalysis;
