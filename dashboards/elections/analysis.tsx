import { TableConfig } from "@charts/table";
import LeftRightCard from "@components/LeftRightCard";
import { SpinnerBox } from "@components/Spinner";
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
const Choropleth = dynamic(() => import("@charts/choropleth"), {
  loading: () => <SpinnerBox height="h-[400px] lg:h-[500px]" width="w-auto" />,
  ssr: false,
});

type Analysis = {
  seat: string;
  state?: string;
  party: string;
  majority: number;
  majority_perc: number;
  voter_turnout: number;
  voter_turnout_perc: number;
  votes_rejected: number;
  votes_rejected_perc: number;
};

interface ElectionAnalysisProps {
  choropleth: any;
  seats: OverallSeat[];
  state: string;
  toggle: number;
}

const ElectionAnalysis: FunctionComponent<ElectionAnalysisProps> = ({
  choropleth,
  seats,
  state,
  toggle,
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
      accessorKey: "majority",
      id: "majority",
      header: t("majority"),
    },
    {
      accessorKey: "majority_perc",
      id: "majority_perc",
      header: t("majority_%"),
    },
    {
      accessorKey: "voter_turnout",
      id: "voter_turnout",
      header: t("voter_turnout"),
    },
    {
      accessorKey: "voter_turnout_perc",
      id: "voter_turnout_perc",
      header: t("voter_turnout_%"),
    },
    {
      accessorKey: "votes_rejected",
      id: "votes_rejected",
      header: t("rejected_votes"),
    },
    {
      accessorKey: "votes_rejected_perc",
      id: "votes_rejected_perc",
      header: t("rejected_votes_%"),
    },
  ];

  const analysisData: Array<Analysis> = seats.map((seat) => {
    const matches = seat.seat.split(", ");
    return {
      seat: matches[0],
      state: matches[1],
      party: seat.party,
      majority: seat.majority,
      majority_perc: seat.majority_perc,
      voter_turnout: seat.voter_turnout,
      voter_turnout_perc: seat.voter_turnout_perc,
      votes_rejected: seat.votes_rejected,
      votes_rejected_perc: seat.votes_rejected_perc,
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
                  majority_perc: 1,
                  voter_turnout_perc: 1,
                  votes_rejected_perc: 1,
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
                  type={toggle === 1 ? "dun" : "parlimen"}
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
