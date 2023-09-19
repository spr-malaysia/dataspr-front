import Metadata from "@components/Metadata";
import APIDocsDashboard from "@dashboards/api-docs";
import { useTranslation } from "@hooks/useTranslation";
import { get } from "@lib/api";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

const APIDocs: Page = ({
  meta,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation(["common"]);

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={t("header")}
        description={t("description")}
        keywords={""}
      />
      <APIDocsDashboard/>
    </AnalyticsProvider>
  );
};

export const getServerSideProps: GetServerSideProps = withi18n(
  "api-docs",
  async () => {
    return {
      props: {
        meta: {
          id: "api-docs",
          type: "misc",
        },
      },
    };
  }
);

export default APIDocs;
