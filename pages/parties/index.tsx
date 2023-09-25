import Metadata from "@components/Metadata";
import ElectionPartiesDashboard from "@dashboards/parties";
import { Party } from "@dashboards/types";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { withi18n } from "@lib/decorators";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

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
      const [party_name, state] =
        Object.keys(query).length === 0
          ? [null, null]
          : [query.name, query.state];

      const [{ data: dropdown }, { data: party }] = await Promise.all([
        get("/explorer", {
        explorer: "ELECTIONS",
          dropdown: "party_list",
        }),
        get("/explorer", {
        explorer: "ELECTIONS",
          chart: "party",
          party_name: party_name ?? "PERIKATAN",
          state: state ?? "mys",
        }),
      ]).catch((e) => {
        throw new Error("Invalid party. Message: " + e);
      });

      return {
        props: {
          last_updated: party.data_last_updated,
          meta: {
            id: "parties",
            type: "dashboard",
          },
          params: {
            party_name: party_name,
            state: state,
          },
          selection: dropdown,
          elections: {
            parlimen:
              party.data.parlimen.sort(
                (a: Party, b: Party) => Date.parse(b.date) - Date.parse(a.date)
              ) ?? [],
            dun:
              party.data.dun.sort(
                (a: Party, b: Party) => Date.parse(b.date) - Date.parse(a.date)
              ) ?? [],
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
