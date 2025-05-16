import Metadata from "@components/Metadata";
import ElectionExplorerDashboard from "@dashboards/elections";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { CountryAndStates } from "@lib/constants";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";

const ElectionExplorerIndex: Page = ({
  choropleth,
  last_updated,
  meta,
  params,
  seats,
  selection,
  table,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { t } = useTranslation("common");

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={t("header")}
        description={t("description")}
        keywords=""
      />
      <ElectionExplorerDashboard
        choropleth={choropleth}
        last_updated={last_updated}
        params={params}
        seats={seats}
        selection={selection}
        table={table}
      />
    </AnalyticsProvider>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = withi18n(
  ["election", "elections", "home", "party"],
  async ({ params }) => {
    try {
      const [state_code, election] = params?.election
        ? (params.election as string[])
        : ["mys", "GE-15"];
      const state = state_code ? CountryAndStates[state_code] : "Malaysia";

      const election_type = election?.startsWith("S") ? "dun" : "parlimen";

      const election_name =
        election?.startsWith("S") &&
        state &&
        ["mys", "kul", "lbn", "pjy"].includes(state_code) === false
          ? `${state} ${election}`
          : election;

      const results = await Promise.allSettled([
        get("/dates.json"),
        get("/result_election.json", {
          election_name,
          state,
          election_type,
        }),
        get("/result_election_summary.json", {
          election_name,
          state: state_code === "mys" ? undefined : state,
          election_type,
        }),
      ]).catch((e) => {
        throw new Error("Invalid election name/state. Message: " + e);
      });

      const [dropdown, table, seats] = results.map((e) => {
        if (e.status === "rejected") return null;
        else return e.value.data;
      });
console.log(election_name)
      if (!seats || !table) return { notFound: true };

      return {
        props: {
          // last_updated: seats.data_last_updated,
          meta: {
            id: "elections",
            type: "dashboard",
          },
          params: { election, state: state_code },
          seats: seats.data,
          selection: dropdown.data ?? [],
          table: table.data,
          choropleth: {},
        },
      };
    } catch (error: any) {
      console.error(error.message);
      return { notFound: true };
    }
  }
);

export default ElectionExplorerIndex;
