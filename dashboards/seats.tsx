import {
  BaseResult,
  ElectionResource,
  ElectionType,
  Seat,
  SeatOptions,
} from "./types";
import FullResults, { Result } from "@components/Election/FullResults";
import { generateSchema } from "@lib/schema/election-explorer";
import { get } from "@lib/api";
import {
  At,
  ComboBox,
  Container,
  Hero,
  Section,
  toast,
} from "@components/index";
import { useCache } from "@hooks/useCache";
import { useData } from "@hooks/useData";
import { useFilter } from "@hooks/useFilter";
import { useTranslation } from "@hooks/useTranslation";
import { OptionType } from "@lib/types";
import dynamic from "next/dynamic";
import { FunctionComponent, useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Seats
 * @overview Status: Live
 */

const ElectionTable = dynamic(
  () => import("@components/Election/ElectionTable"),
  {
    ssr: false,
  }
);
const Toast = dynamic(() => import("@components/Toast"), { ssr: false });

interface ElectionSeatsProps extends ElectionResource<Seat> {
  selection: Array<SeatOptions & { slug: string }>;
}

type SeatOption = {
  seat_area: string;
  seat_name: string;
  type: ElectionType;
};

const ElectionSeatsDashboard: FunctionComponent<ElectionSeatsProps> = ({
  elections,
  last_updated,
  params,
  selection,
}) => {
  const { t } = useTranslation(["common", "home"]);
  const { cache } = useCache();

  const SEAT_OPTIONS: Array<OptionType & SeatOptions & { seat_area: string }> =
    selection.map(({ seat_name, slug, type }) => ({
      label: seat_name.concat(` (${t(type)})`),
      value: type + "_" + slug,
      seat_area: seat_name.split(", ")[1],
      seat_name: seat_name.split(", ")[0],
      type: type,
    }));

  const DEFAULT_SEAT =
    params.type && params.seat_name
      ? `${params.type}_${params.seat_name}`
      : "parlimen_padang-besar-perlis";

  const SEAT_OPTION = SEAT_OPTIONS.find((e) => e.value === DEFAULT_SEAT);

  const { data, setData } = useData({
    seat_option: SEAT_OPTION,
    seat_name: SEAT_OPTION?.label,
    loading: false,
    elections: elections,
  });

  const { setFilter } = useFilter({
    name: params.seat_name,
    type: params.type,
  });

  const fetchFullResult = async (
    election: string,
    seat: string
  ): Promise<Result<BaseResult[]>> => {
    const identifier = `${election}_${seat}`;
    return new Promise(async (resolve) => {
      if (cache.has(identifier)) return resolve(cache.get(identifier));
      const results = await Promise.allSettled([
        get("/result_ballot.json", { election, seat }),
        get("/result_ballot_summary.json", { election, seat }),
      ]).catch((e) => {
        toast.error(t("toast.request_failure"), t("toast.try_again"));
        throw new Error("Invalid seat. Message: " + e);
      });

      const [{ data: ballot }, { data: ballot_summary }] = results.map((e) => {
        if (e.status === "rejected") return {};
        else return e.value.data;
      });
      const summary = ballot_summary[0];

      const result: Result<BaseResult[]> = {
        data: ballot,
        votes: [
          {
            x: "majority",
            abs: summary.majority,
            perc: summary.majority_perc,
          },
          {
            x: "voter_turnout",
            abs: summary.voter_turnout,
            perc: summary.voter_turnout_perc,
          },
          {
            x: "rejected_votes",
            abs: summary.votes_rejected,
            perc: summary.votes_rejected_perc,
          },
        ],
      };
      cache.set(identifier, result);
      resolve(result);
    });
  };

  const seat_schema = generateSchema<Seat>([
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
          <FullResults
            options={data.elections}
            currentIndex={row.index}
            onChange={(option: Seat) =>
              fetchFullResult(option.election_name, option.seat)
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
          />
        );
      },
    },
  ]);

  const { events } = useRouter();
  useEffect(() => {
    const finishLoading = () => setData("loading", false);
    events.on("routeChangeComplete", finishLoading);
    return () => events.off("routeChangeComplete", finishLoading);
  }, []);

  return (
    <>
      <Toast />
      <Hero
        background="red"
        category={[t("hero.category", { ns: "home" }), "text-danger"]}
        header={[t("hero.header", { ns: "home" })]}
        description={[t("hero.description", { ns: "home" })]}
        action={
          <div className="flex flex-wrap gap-3">
            <At
              className="btn btn-border active:bg-slate-100 shadow-button bg-white px-3 py-1.5 text-sm text-zinc-900"
              href="/data-catalogue"
              enableIcon
            >
              {t("nav.catalogue")}
            </At>
            <At className="btn px-3 py-1.5 text-sm" href="/api-docs" enableIcon>
              {t("nav.api_docs")}
            </At>
          </div>
        }
      />

      <Container>
        <Section>
          <div className="xl:grid xl:grid-cols-12">
            <div className="xl:col-span-10 xl:col-start-2">
              <h4 className="text-center">{t("header", { ns: "home" })}</h4>
              <div className="mx-auto w-full py-6 sm:w-[500px]">
                <ComboBox<SeatOption>
                  placeholder={t("search_seat", { ns: "home" })}
                  options={SEAT_OPTIONS} // TODO: reduce search options length
                  config={{
                    baseSort: (a, b) => {
                      if (a.item.seat_name === b.item.seat_name) {
                        return a.item.type === "parlimen" ? -1 : 1;
                      } else {
                        return String(a.item.seat_name).localeCompare(
                          String(b.item.seat_name)
                        );
                      }
                    },
                    keys: ["seat_name", "seat_area", "type"],
                  }}
                  format={(option) => (
                    <>
                      <span>{`${option.seat_name}, ${option.seat_area} `}</span>
                      <span className="text-zinc-500">
                        {"(" + t(option.type) + ")"}
                      </span>
                    </>
                  )}
                  selected={SEAT_OPTIONS.find(
                    (e) => e.value === (data.seat_option ?? DEFAULT_SEAT)
                  )}
                  onChange={(selected) => {
                    if (selected) {
                      setData("loading", true);
                      setData("seat_name", selected.label);

                      const [type, seat_name] = selected.value.split("_");
                      setFilter("name", seat_name);
                      setFilter("type", type);
                    }
                    setData("seat_option", selected);
                  }}
                />
              </div>
              <ElectionTable
                title={
                  <h5 className="py-6">
                    {t("title", { ns: "home" })}
                    <span className="text-primary">{SEAT_OPTION?.label}</span>
                  </h5>
                }
                data={elections}
                columns={seat_schema}
                isLoading={data.loading}
              />
            </div>
          </div>
        </Section>
      </Container>
    </>
  );
};

export default ElectionSeatsDashboard;
