import { BaseResult, ElectionEnum, Seat, SeatResult } from "./types";
import ElectionCard, { Result } from "@components/Election/ElectionCard";
import { FaceFrownIcon } from "@heroicons/react/24/outline";
import { generateSchema } from "@lib/schema/election-explorer";
import { get } from "@lib/api";
import {
  Container,
  Dropdown,
  Hero,
  Panel,
  StateDropdown,
  Tabs,
  toast,
} from "@components/index";
import { CountryAndStates } from "@lib/constants";
import { useCache } from "@hooks/useCache";
import { useData } from "@hooks/useData";
import { useTranslation } from "@hooks/useTranslation";
import { SPRIconSolid } from "@icons/index";
import { OptionType } from "@lib/types";
import dynamic from "next/dynamic";
import { FunctionComponent } from "react";

/**
 * Trivia 
 * @overview Status: Live
 */

const BarMeter = dynamic(() => import("@charts/bar-meter"), { ssr: false });
const ElectionTable = dynamic(() => import("@components/Election/ElectionTable"), {
  ssr: false,
});

interface ElectionTriviaProps {
  dun_bar: any;
  last_updated: string;
  params: { state: string };
  parlimen_bar: any;
  table_top: any;
}

const ElectionTriviaDashboard: FunctionComponent<ElectionTriviaProps> = ({
  dun_bar,
  last_updated,
  params,
  parlimen_bar,
  table_top,
}) => {
  const { t } = useTranslation(["common", "trivia", "parties"]);
  const { cache } = useCache();
  const { data, setData } = useData({
    filter: "slim",
    loading: false,
    state: params.state,
    tab_index: 0,
  });

  const FILTER_OPTIONS: Array<OptionType> = ["slim", "big"].map(
    (key: string) => ({
      label: t(`trivia:${key}`),
      value: key,
    })
  );

  const fetchResult = async (
    election: string,
    seat: string
  ): Promise<Result<BaseResult[]>> => {
    const identifier = `${election}_${seat}`;
    return new Promise((resolve) => {
      if (cache.has(identifier)) return resolve(cache.get(identifier));
      get("/explorer", {
        explorer: "ELECTIONS",
        chart: "full_result",
        type: "candidates",
        election,
        seat,
      })
        .then(({ data }: { data: { data: SeatResult } }) => {
          const data2 = data.data;
          const result: Result<BaseResult[]> = {
            data: data2.data.sort((a, b) => b.votes.abs - a.votes.abs),
            votes: [
              {
                x: "majority",
                abs: data2.votes.majority,
                perc: data2.votes.majority_perc,
              },
              {
                x: "voter_turnout",
                abs: data2.votes.voter_turnout,
                perc: data2.votes.voter_turnout_perc,
              },
              {
                x: "rejected_votes",
                abs: data2.votes.votes_rejected,
                perc: data2.votes.votes_rejected_perc,
              },
            ],
          };
          cache.set(identifier, result);
          resolve(result);
        })
        .catch((e) => {
          toast.error(
            t("toast.request_failure"),
            t("toast.try_again")
          );
          console.error(e);
        });
    });
  };

  const seat_schema = generateSchema<Seat>([
    {
      key: (_, index) => index + 1,
      id: "index",
      header: "#",
      cell: ({ row }) => {
        row.index + 1;
      },
    },
    {
      key: "election_name",
      id: "election_name",
      header: t("election_name"),
    },
    { key: "seat", id: "seat", header: t("constituency") },
    {
      key: "party",
      id: "party",
      header: t("winning_party"),
    },
    { key: "name", id: "name", header: t("candidate_name") },
    { key: "majority", id: "majority", header: t("majority") },
    {
      key: (item) => item,
      id: "full_result",
      header: "",
      cell: ({ row, getValue }) => {
        const item = getValue() as Seat;

        return (
          <ElectionCard
            defaultParams={item}
            onChange={(option: Seat) =>
              fetchResult(option.election_name, option.seat)
            }
            columns={generateSchema<BaseResult>([
              { key: "name", id: "name", header: t("candidate_name") },
              {
                key: "party",
                id: "party",
                header: t("party_name"),
              },
              {
                key: "votes",
                id: "votes",
                header: t("votes_won"),
              },
            ])}
            options={
              table_top.dun
                ? table_top[
                    data.tab_index === ElectionEnum.Parlimen
                      ? "parlimen"
                      : "dun"
                  ][data.filter]
                : {}
            }
            page={row.index}
          />
        );
      },
    },
  ]);

  return (
    <>
      <Hero
        background="red"
        category={[t("category"), "text-danger"]}
        header={[t("header")]}
        description={[t("description")]}
        last_updated={last_updated}
      />
      <Container>
        <div className="py-8 lg:py-12 xl:grid xl:grid-cols-12">
          <div className="space-y-12 xl:col-span-10 xl:col-start-2">
            <div className="flex flex-col items-center gap-6">
              <h4 className="text-center">
                {t("trivia:header", {
                  country: CountryAndStates[params.state],
                })}
              </h4>
              <StateDropdown
                url={"/trivia"}
                anchor="left"
                width="w-fit"
                currentState={params.state}
                exclude={["kul", "lbn", "pjy"]}
              />
            </div>

            <div className="space-y-12 lg:space-y-6">
              <div className="border-slate-200 dark:border-zinc-800 w-full space-y-6 rounded-xl border-0 p-0 lg:border lg:p-8">
                <div className="gap-3">
                  <SPRIconSolid className="text-primary mx-auto h-16 w-16" />
                  <h5 className="text-center">
                    {t("trivia:majority", {
                      country: CountryAndStates[params.state],
                      context: data.filter,
                    })}
                  </h5>
                </div>
                <Tabs
                  title={
                    <Dropdown
                      anchor="left"
                      width="w-fit"
                      options={FILTER_OPTIONS}
                      selected={FILTER_OPTIONS.find(
                        (e) => e.value === data.filter
                      )}
                      onChange={(e) => setData("filter", e.value)}
                    />
                  }
                  current={data.tab_index}
                  onChange={(index: number) => setData("tab_index", index)}
                >
                  <Panel name={t("parlimen")}>
                    <div className="max-h-[500px] overflow-auto md:max-h-full">
                      <ElectionTable
                        data={table_top.parlimen[data.filter].sort(
                          (a: Seat, b: Seat) =>
                            data.filter === "big" &&
                            Number(b.majority) - Number(a.majority)
                        )}
                        columns={seat_schema}
                        isLoading={data.loading}
                        highlightedRows={[0, 1, 2]}
                      />
                    </div>
                  </Panel>
                  <Panel name={t("dun")}>
                    <ElectionTable
                      data={
                        table_top.dun
                          ? table_top.dun[data.filter].sort(
                              (a: Seat, b: Seat) =>
                                data.filter === "big" &&
                                Number(b.majority) - Number(a.majority)
                            )
                          : {}
                      }
                      columns={seat_schema}
                      isLoading={data.loading}
                      highlightedRows={[0, 1, 2]}
                      empty={t("parties:no_data_dun_wp", {
                        state: CountryAndStates[params.state],
                      })}
                    />
                  </Panel>
                </Tabs>
              </div>
              <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-6 xl:grid-cols-6">
                <div className="border-slate-200 dark:border-zinc-800 space-y-6 rounded-xl border-0 p-0 lg:border lg:p-8 xl:col-span-2 xl:col-start-2">
                  <h5 className="text-center">{t("trivia:ge_veterans")}</h5>
                  <BarMeter
                    layout="horizontal"
                    data={parlimen_bar.competed}
                    relative
                    formatY={(y, x) => (
                      <p className="whitespace-nowrap">{`${y} (${t(
                        "trivia:won"
                      )} ${
                        parlimen_bar.won.find(
                          (e: Record<string, any>) => e.x === x
                        )?.y
                      })`}</p>
                    )}
                  />
                </div>
                <div className="border-slate-200 dark:border-zinc-800 flex h-max flex-col gap-y-6 rounded-xl border-0 p-0 lg:border lg:p-8 xl:col-span-2 xl:col-start-4">
                  <h5 className="text-center">{t("trivia:se_veterans")}</h5>
                  {dun_bar.data ? (
                    <BarMeter
                      layout="horizontal"
                      data={dun_bar.data && dun_bar.data.competed}
                      relative
                      formatY={(y, x) => (
                        <p className="whitespace-nowrap">{`${y} (${t(
                          "trivia:won"
                        )} ${
                          dun_bar.data.won.find(
                            (e: Record<string, any>) => e.x === x
                          )?.y
                        })`}</p>
                      )}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="bg-slate-200 dark:bg-zinc-800 flex h-auto w-[300px] rounded-md px-3 pb-2 pt-1">
                        <p className="text-sm">
                          <span className="inline-flex pr-1">
                            <FaceFrownIcon className="h-5 w-5 translate-y-1" />
                          </span>
                          {t("parties:no_data_dun_wp", {
                            state: CountryAndStates[params.state],
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default ElectionTriviaDashboard;