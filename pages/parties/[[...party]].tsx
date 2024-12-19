import Metadata from "@components/Metadata";
import ElectionPartiesDashboard from "@dashboards/parties";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { CountryAndStates } from "@lib/constants";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";

const ElectionParties: Page = ({
  last_updated,
  meta,
  params,
  selection,
  elections,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { t } = useTranslation("common");

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={t("header")}
        description={t("description")}
        keywords=""
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

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = withi18n(
  ["election", "parties", "party"],
  async ({ params }) => {
    try {
      const [party, state_code] = params?.party
      ? (params.party as string[])
      : [null, null];
      const state = state_code ? CountryAndStates[state_code] : "Malaysia";

      const results = await Promise.allSettled([
        get("/dropdown_parties.json"),
        get("/query_party.json", {
          party: party ?? "PERIKATAN",
          state,
          election_type: "parlimen",
        }),
        ...(state_code !== "mys"
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

      const [dropdown, parlimen, dun] = results.map((e) => {
        if (e.status === "rejected") return null;
        else return e.value.data;
      });
      const selection: Array<{ party: string }> = dropdown.data;
      const partyExists = selection.some((e) => e.party === party);

      if (party && !partyExists) return { notFound: true };

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
          selection,
          elections: {
            parlimen: parlimen.data ?? [],
            dun: state_code !== "mys" ? dun.data : [],
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
