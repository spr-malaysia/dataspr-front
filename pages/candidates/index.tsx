import Metadata from "@components/Metadata";
import ElectionCandidatesDashboard from "@dashboards/candidates";
import { Candidate } from "@dashboards/types";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

const ElectionCandidates: Page = ({
  elections,
  last_updated,
  meta,
  params,
  selection,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation("common");

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={t("header")}
        description={t("description")}
        keywords={""}
      />
      <ElectionCandidatesDashboard
        elections={elections}
        last_updated={last_updated}
        params={params}
        selection={selection}
      />
    </AnalyticsProvider>
  );
};

export const getServerSideProps: GetServerSideProps = withi18n(
  "candidates",
  async ({ query }) => {
    try {
      const name = Object.keys(query).length === 0 ? null : query.name;
      // const [{ data: dropdown }, { data: candidate }] = await Promise.all([
      //   get("/explorer", {
      //     explorer: "ELECTIONS",
      //     dropdown: "candidate_list",
      //   }),
      //   get("/explorer", {
      //     explorer: "ELECTIONS",
      //     chart: "candidates",
      //     name: name ?? "tunku-abdul-rahman-putra-alhaj",
      //   }),
      // ]).catch((e) => {
      //   throw new Error("Invalid candidate name. Message: " + e);
      // });

      return {
        props: {
          last_updated: "",//candidate.data_last_updated,
          meta: {
            id: "candidates",
            type: "dashboard",
          },
          params: { candidate_name: name },
          selection: [],//dropdown,
          elections: {
            parlimen: [],
              // candidate.data.parlimen.sort(
              //   (a: Candidate, b: Candidate) =>
              //     Date.parse(b.date) - Date.parse(a.date)
              // ) ?? [],
            dun: [],
              // candidate.data.dun.sort(
              //   (a: Candidate, b: Candidate) =>
              //     Date.parse(b.date) - Date.parse(a.date)
              // ) ?? [],
          },
        },
      };
    } catch (e: any) {
      console.error(e.message);
      return { notFound: true };
    }
  }
);

export default ElectionCandidates;
