import {
  BaseResult,
  Candidate,
  ElectionResource,
} from "./types";
import FullResults, { Result } from "@components/Election/FullResults";
import { generateSchema } from "@lib/schema/election-explorer";
import { get } from "@lib/api";
import {
  ComboBox,
  Container,
  Hero,
  Panel,
  Section,
  Tabs,
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
 * Candidates Dashboard
 * @overview Status: Live
 */

const ElectionTable = dynamic(
  () => import("@components/Election/ElectionTable"),
  {
    ssr: false,
  }
);
const Toast = dynamic(() => import("@components/Toast"), { ssr: false });

interface ElectionCandidatesProps extends ElectionResource<Candidate> {
  selection: Record<"name" | "slug", string>[];
}

const ElectionCandidatesDashboard: FunctionComponent<
  ElectionCandidatesProps
> = ({ elections, last_updated, params, selection }) => {
  const { t } = useTranslation(["common", "candidates"]);

  const CANDIDATE_OPTIONS: Array<OptionType> = selection.map(
    ({ name, slug }) => {
      return { label: name, value: slug };
    }
  );

  const DEFAULT_CANDIDATE = "tunku-abdul-rahman-putra-alhaj";
  const CANDIDATE_OPTION = CANDIDATE_OPTIONS.find(
    (e) => e.value === (params.candidate_name ?? DEFAULT_CANDIDATE)
  );

  const { cache } = useCache();
  const { data, setData } = useData({
    tab_index: 0, // parlimen = 0; dun = 1
    candidate_option: CANDIDATE_OPTION,
    candidate_name: CANDIDATE_OPTION?.label,
    loading: false,
    parlimen: elections.parlimen,
    dun: elections.dun,
  });
  const { setFilter } = useFilter({
    name: params.candidate_name,
  });

  const candidate_schema = generateSchema<Candidate>([
    { key: "election_name", id: "election_name", header: t("election_name") },
    { key: "seat", id: "seat", header: t("constituency") },
    { key: "party", id: "party", header: t("party_name") },
    { key: "votes", id: "votes", header: t("votes_won") },
    { key: "result", id: "result", header: t("result") },
    {
      key: (item) => item,
      id: "full_result",
      header: "",
      cell: ({ row, getValue }) => {
        const selection =
          data.tab_index === 0 ? elections.parlimen : elections.dun;

        return (
          <FullResults
            options={selection}
            currentIndex={row.index}
            onChange={(option: Candidate) =>
              fetchFullResult(option.election_name, option.seat)
            }
            columns={generateSchema<BaseResult>([
              {
                key: "name",
                id: "name",
                header: t("candidate_name"),
              },
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
            highlighted={data.candidate_option ? data.candidate_option.label : DEFAULT_CANDIDATE}
          />
        );
      },
    },
  ]);

  const fetchFullResult = async (
    election: string,
    seat: string
  ): Promise<Result<BaseResult[]>> => {
    const identifier = `${election}_${seat}`;
    return new Promise(async (resolve) => {
      if (cache.has(identifier)) return resolve(cache.get(identifier));
      const results = await Promise.allSettled([
        get("/result_ballot.json", {
          election,
          seat,
        }),
        get("/result_ballot_summary.json", {
          election,
          seat,
        }),
      ]).catch((e) => {
        toast.error(t("toast.request_failure"), t("toast.try_again"));
        throw new Error("Invalid election or seat. Message: " + e);
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
        category={[t("hero.category", { ns: "candidates" }), "text-danger"]}
        header={[t("hero.header", { ns: "candidates" })]}
        description={[t("hero.description", { ns: "candidates" })]}
        last_updated={last_updated}
      />
      <Container>
        <Section>
          <div className="xl:grid xl:grid-cols-12">
            <div className="xl:col-span-10 xl:col-start-2">
              <h4 className="text-center">
                {t("header", { ns: "candidates" })}
              </h4>
              <div className="mx-auto w-full py-6 sm:w-[500px]">
                <ComboBox
                  placeholder={t("search_candidate", { ns: "candidates" })}
                  options={CANDIDATE_OPTIONS}
                  selected={
                    data.candidate_option
                      ? CANDIDATE_OPTIONS.find(
                          (e) => e.value === (params.candidate_name ?? DEFAULT_CANDIDATE)
                        )
                      : null
                  }
                  onChange={(selected) => {
                    if (selected) {
                      setData("loading", true);
                      setData("candidate_name", selected.label);
                      setFilter("name", selected.value);
                    }
                    setData("candidate_option", selected);
                  }}
                />
              </div>
              <Tabs
                title={
                  <h5>
                    {t("title", { ns: "candidates" })}
                    <span className="text-primary">{CANDIDATE_OPTION?.label}</span>
                  </h5>
                }
                current={data.tab_index}
                onChange={(index) => setData("tab_index", index)}
                className="py-6"
              >
                <Panel name={t("parlimen")}>
                  <ElectionTable
                    data={elections.parlimen}
                    columns={candidate_schema}
                    isLoading={data.loading}
                    empty={t("no_data", {
                      ns: "candidates",
                      name: data.candidate_name,
                      context: "parliament",
                    })}
                  />
                </Panel>
                <Panel name={t("dun")}>
                  <ElectionTable
                    data={elections.dun}
                    columns={candidate_schema}
                    isLoading={data.loading}
                    empty={t("no_data", {
                      ns: "candidates",
                      name: data.candidate_name,
                      context: "dun",
                    })}
                  />
                </Panel>
              </Tabs>
            </div>
          </div>
        </Section>
      </Container>
    </>
  );
};

export default ElectionCandidatesDashboard;
