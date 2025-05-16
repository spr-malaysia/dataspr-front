import Metadata from "@components/Metadata";
import ElectionExplorerDashboard from "@dashboards/elections";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { CountryAndStates } from "@lib/constants";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

const ElectionExplorerIndex: Page = ({
  choropleth,
  last_updated,
  meta,
  params,
  seats,
  selection,
  table,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation("common");

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={t("header")}
        description={t("description")}
        keywords={""}
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

export const getServerSideProps: GetServerSideProps = withi18n(
  ["election", "elections", "home", "party"],
  async ({ query }) => {
    try {
      const [election, state] =
        Object.keys(query).length === 0
          ? [null, null]
          : [query.election?.toString(), query.state?.toString()];

      const election_type = election?.startsWith("S") ? "dun" : "parlimen";

      const election_name =
        election?.startsWith("S") &&
        state &&
        ["mys", "kul", "lbn", "pjy"].includes(state) === false
          ? `${CountryAndStates[state]} ${election}`
          : election;

      const results = await Promise.allSettled([
        get("/dates.json"),
        get("/result_election.json", {
          election_name: election_name ?? "GE-15",
          state: state ? CountryAndStates[state] : "Malaysia",
          election_type,
        }),
        get("/result_election_summary.json", {
          election_name: election_name ?? "GE-15",
          state: state ? CountryAndStates[state] : undefined,
          election_type,
        }),
      ]).catch((e) => {
        throw new Error("Invalid election name/state. Message: " + e);
      });

      const [{ data: dropdown }, { data: table }, { data: seats }] =
        results.map((e) => {
          if (e.status === "rejected") return {};
          else return e.value.data;
        });

      return {
        props: {
          // last_updated: seats.data_last_updated,
          meta: {
            id: "elections",
            type: "dashboard",
          },
          params: { election, state },
          seats: seats,
          selection: dropdown ?? [],
          table: table,
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
