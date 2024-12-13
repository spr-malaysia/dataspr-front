import Metadata from "@components/Metadata";
import ElectionSeatsDashboard from "@dashboards/seats";
import { get } from "@lib/api";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

/**
 * Home
 * @overview Status: Live
 */

const Home: Page = ({
  last_updated,
  params,
  selection,
  elections,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <>
      <Metadata keywords={"data.spr.gov.my data malaysia election"} />
      <ElectionSeatsDashboard
        elections={elections}
        last_updated={last_updated}
        params={params}
        selection={selection}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = withi18n(
  ["home", "election"],
  async ({ query }) => {
    try {
      const [slug, type] =
        Object.keys(query).length === 0
          ? [null, null]
          : [query.name, query.type];

      const results = await Promise.allSettled([
        get("/dropdown_seats.json"),
        get("/query_area.json", {
          slug: slug ?? "padang-besar-perlis",
        }),
      ]).catch((e) => {
        throw new Error("Invalid candidate name. Message: " + e);
      });

      const [{ data: dropdown }, { data: seat }] = results.map((e) => {
        if (e.status === "rejected") return {};
        else return e.value.data;
      });

      return {
        notFound: false,
        props: {
          last_updated: "",
          meta: {
            id: "home",
            type: "misc",
          },
          params: { seat_name: slug, type: type },
          selection: dropdown,
          elections: seat ?? [],
        },
      };
    } catch (error: any) {
      console.error(error.message);
      return { notFound: true };
    }
  }
);

export default Home;
