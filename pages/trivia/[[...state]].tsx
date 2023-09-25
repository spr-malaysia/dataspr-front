import Layout from "@components/Layout";
import Metadata from "@components/Metadata";
import StateDropdown from "@components/Dropdown/StateDropdown";
import StateModal from "@components/Modal/StateModal";
import { body } from "@lib/configs/font";
import ElectionTriviaDashboard from "@dashboards/trivia";
import { AnalyticsProvider } from "@lib/contexts/analytics";
import { useTranslation } from "@hooks/useTranslation";
import { WindowProvider } from "@lib/contexts/window";
import { get } from "@lib/api";
import { CountryAndStates } from "@lib/constants";
import { withi18n } from "@lib/decorators";
import { clx } from "@lib/helpers";
import { Page } from "@lib/types";
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";

const ElectionTriviaState: Page = ({
  dun_bar,
  last_updated,
  meta,
  params,
  parlimen_bar,
  table_top,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { t } = useTranslation("common");

  return (
    <AnalyticsProvider meta={meta}>
      <Metadata
        title={CountryAndStates[params.state].concat(" - Trivia")}
        description={t("description")}
        keywords={""}
      />
      <ElectionTriviaDashboard
        dun_bar={dun_bar}
        last_updated={last_updated}
        params={params}
        parlimen_bar={parlimen_bar}
        table_top={table_top}
      />
    </AnalyticsProvider>
  );
};

ElectionTriviaState.layout = (page, props) => (
  <WindowProvider>
    <Layout
      className={clx(body.variable, "font-sans")}
      stateSelector={
        <StateDropdown
          width="w-max xl:w-64"
          url="/trivia"
          exclude={["kul", "lbn", "pjy"]}
          currentState={props.params.state}
          hideOnScroll
        />
      }
    >
      <StateModal
        state={props.params.state}
        url="/trivia"
        exclude={["kul", "lbn", "pjy"]}
      />
      {page}
    </Layout>
  </WindowProvider>
);

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = withi18n(
  ["trivia", "parties"],
  async ({ params }) => {
    const state = params?.state ? params.state[0] : "mys";
    const { data } = await get("/dashboard", {
      dashboard: "election_trivia",
      state,
    });

    return {
      notFound: false,
      props: {
        last_updated: data.data_last_updated,
        meta: {
          id: "trivia",
          type: "dashboard",
        },
        dun_bar: data.dun_bar ?? {},
        params: { state },
        parlimen_bar: data.parlimen_bar.data,
        table_top: data.table_top.data,
      },
    };
  }
);

export default ElectionTriviaState;
