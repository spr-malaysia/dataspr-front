import Metadata from "@components/Metadata";
import ElectionPartiesDashboard from "@dashboards/parties";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { withi18n } from "@lib/decorators";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { CountryAndStates } from "@lib/constants";

const ElectionParties: Page = ({
  last_updated,
  meta,
  params,
  selection,
  elections,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation("common");

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={t("header")}
        description={t("description")}
        keywords={""}
      />
      <ElectionPartiesDashboard
        elections={elections}
        last_updated={last_updated}
        params={params}
        selection={selection}
      />
    </AnalyticsProvider>
  );
};

export const getServerSideProps: GetServerSideProps = withi18n(
  ["election", "parties", "party"],
  async ({ query }) => {
    try {
      const [party, state_code] =
        Object.keys(query).length === 0
          ? [null, null]
          : [query.name?.toString(), query.state?.toString()];

      const state = state_code ? CountryAndStates[state_code] : "Malaysia";
      const results = await Promise.allSettled([
        get("/dropdown_parties.json"),
        get("/query_party.json", {
          party: party ?? "PERIKATAN",
          state,
          election_type: "parlimen",
        }),
        ...(state_code === "mys"
          ? [
              get("/query_party.json", {
                party: party ?? "PERIKATAN",
                state,
                election_type: "dun",
              }),
            ]
          : []),
      ]).catch((e) => {
        throw new Error("Invalid party name. Message: " + e);
      });

      const [{ data: dropdown }, { data: parlimen }, dun] = results.map((e) => {
        if (e.status === "rejected") return {};
        else return e.value.data;
      });

      return {
        props: {
          // last_updated: party.data_last_updated,
          meta: {
            id: "parties",
            type: "dashboard",
          },
          params: {
            party,
            state: state_code,
          },
          selection: dropdown,
          elections: {
            parlimen: parlimen ?? [],
            dun: state_code === "mys" ? dun.data : [],
          },
        },
      };
    } catch (e: any) {
      console.error(e.message);
      return { notFound: true };
    }
  }
);

export default ElectionParties;
