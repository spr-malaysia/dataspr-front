import Metadata from "@components/Metadata";
import ElectionSeatsDashboard from "@dashboards/seats";
import { Seat } from "@dashboards/types";
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
      const [name, type] =
        Object.keys(query).length === 0
          ? [null, null]
          : [query.name, query.type];

      const [{ data: dropdown }, { data: seat }] = await Promise.all([
        get("/spr-dashboard", {
          dropdown: "seats_list",
        }),
        get("/spr-dashboard", {
          chart: "seats",
          seat_name: name ?? "padang-besar-perlis",
          type: type ?? "parlimen",
        }),
      ]).catch((e) => {
        throw new Error("Invalid seat name. Message: " + e);
      });

      return {
        notFound: false,
        props: {
          last_updated: "",
          meta: {
            id: "home",
            type: "misc",
          },
          params: { seat_name: name, type: type },
          selection: dropdown,
          elections: 
          seat.data.sort(
            (a: Seat, b: Seat) =>
              Number(new Date(b.date)) - Number(new Date(a.date))
          ) ?? [],
        },
      };
    } catch (error: any) {
      console.error(error.message);
      return { notFound: true };
    }
  }
);

export default Home;
