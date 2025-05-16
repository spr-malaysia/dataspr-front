import { BaseResult, OverallSeat } from "../types";
import { Won } from "@components/Election/ResultBadge";
import ElectionTable from "@components/Election/ElectionTable";
import { Dialog, Transition } from "@headlessui/react";
import { ArrowsPointingOutIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { generateSchema } from "@lib/schema/election-explorer";
import { get } from "@lib/api";
import BarPerc from "@charts/bar-perc";
import {
  ComboBox,
  ImageWithFallback,
  LeftRightCard,
  Section,
  toast,
} from "@components/index";
import { clx, numFormat, toDate } from "@lib/helpers";
import { useCache } from "@hooks/useCache";
import { useData } from "@hooks/useData";
import { useTranslation } from "@hooks/useTranslation";
import {
  Fragment,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CountryAndStates } from "@lib/constants";

/**
 * Election Explorer - Ballot Seat
 * @overview Status: In-development
 */

interface BallotSeatProps {
  seats: OverallSeat[];
  state: string;
  election: string | undefined;
}

const BallotSeat: FunctionComponent<BallotSeatProps> = ({
  seats,
  state,
  election,
}) => {
  const { t, i18n } = useTranslation(["common", "elections", "home"]);
  const { cache } = useCache();
  const scrollRef = useRef<Record<string, HTMLDivElement | null>>({});

  const [show, setShow] = useState<boolean>(false);
  const { data, setData } = useData({
    seat: seats[0],
    search_seat: seats[0],
    seat_loading: false,
    seat_result: {
      data: [],
      votes: [],
    },
  });

  const fetchSeatResult = async (seat: string) => {
    if (!election) return;
    const identifier = `${state}-${election}-${seat}`;
    if (cache.has(identifier))
      return setData("seat_result", cache.get(identifier));
    else {
      setData("seat_loading", true);
      const election_name =
        election.startsWith("S") &&
        state &&
        ["mys", "kul", "lbn", "pjy"].includes(state) === false
          ? `${CountryAndStates[state]} ${election}`
          : election;

      const results = await Promise.allSettled([
        get("/result_ballot.json", {
          election: election_name,
          seat,
        }),
        get("/result_ballot_summary.json", {
          election: election_name,
          seat,
        }),
      ]).catch((e) => {
        toast.error(t("toast.request_failure"), t("toast.try_again"));
        throw new Error("Invalid election or seat. Message: " + e);
      });

      const [{ data: ballot }, { data: ballot_summary }] = results.map((e) => {
        if (e.status === "rejected") return {};
        else return e.value.data;
      });
      const summary = ballot_summary[0];

      const result = {
        data: ballot,
        votes: [
          {
            x: "majority",
            abs: summary.majority,
            perc: summary.majority_perc,
          },
          {
            x: "voter_turnout",
            abs: summary.voter_turnout,
            perc: summary.voter_turnout_perc,
          },
          {
            x: "rejected_votes",
            abs: summary.votes_rejected,
            perc: summary.votes_rejected_perc,
          },
        ],
      };
      cache.set(identifier, result);
      setData("seat_result", result);
      setData("seat_loading", false);
    }
  };

  useEffect(() => {
    if (seats.length > 0) fetchSeatResult(seats[0].seat);
  }, [seats]);

  const SEAT_OPTIONS = seats.map((seat) => ({
    label: seat.seat,
    value: seat.seat,
  }));

  const BallotCard = () => {
    const [area, state] = data.seat.seat.split(",");
    const date = toDate(data.seat.date, "dd MMM yyyy", i18n.language);

    return (
      <div className="space-y-8 overflow-y-auto">
        <div className="flex items-start gap-4 lg:items-center">
          <div className="space-y-2">
            <div className="mr-6 flex flex-wrap gap-x-3 uppercase">
              <h5>{area}</h5>
              <p className="text-zinc-500 text-lg">{state}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3">
              <p>{t(`${election?.slice(-5)}`)}</p>
              <p className="text-zinc-500">{date}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="font-bold">{t("election_result")}</div>
          <ElectionTable
            className="max-h-[400px] w-full overflow-y-auto"
            data={data.seat_result.data}
            columns={generateSchema<BaseResult>([
              {
                key: "name",
                id: "name",
                header: t("candidate_name"),
              },
              {
                key: "party",
                id: "party",
                header: t("party_name"),
              },
              {
                key: "votes",
                id: "votes",
                header: t("votes_won"),
              },
            ])}
            isLoading={data.seat_loading}
            highlightedRows={[0]}
            result="won"
          />
        </div>

        <div className="space-y-3">
          <div className="font-bold">{t("voting_statistics")}</div>
          <div className="flex flex-col gap-3 text-sm">
            {data.seat_result.votes.map(
              (item: { x: string; abs: number; perc: number }) => (
                <div className="flex space-x-3 whitespace-nowrap" key={item.x}>
                  <p className="w-28">{t(item.x)}:</p>
                  <div className="flex items-center space-x-3">
                    <BarPerc
                      hidden
                      value={item.perc}
                      size={"h-[5px] w-[50px]"}
                    />
                    <p>{`${
                      item.abs !== null ? numFormat(item.abs, "standard") : "—"
                    } ${
                      item.perc !== null
                        ? `(${numFormat(item.perc, "compact", 1)}%)`
                        : "(—)"
                    }`}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Section>
      <div className="grid grid-cols-12">
        <div className="col-span-full col-start-1 space-y-12 xl:col-span-10 xl:col-start-2">
          <div className="space-y-6">
            <h4 className="text-center">
              {t("header_2", { ns: "elections" })}
            </h4>
            <LeftRightCard
              left={
                <div
                  className="bg-slate-50 dark:bg-zinc-800 relative flex h-fit w-full flex-col overflow-hidden 
                rounded-t-xl px-3 pb-3 md:overflow-y-auto lg:h-[600px] lg:rounded-bl-xl lg:rounded-tr-none lg:pb-6 xl:px-6"
                >
                  <div className="bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 sticky top-0 z-10 border-b pb-3 pt-6">
                    <ComboBox
                      placeholder={t("home:search_seat")}
                      options={SEAT_OPTIONS}
                      selected={
                        data.search_seat
                          ? SEAT_OPTIONS.find(
                              (e) => e.value === data.search_seat
                            )
                          : null
                      }
                      onChange={(selected) => {
                        if (selected) {
                          fetchSeatResult(selected.value);
                          setData(
                            "seat",
                            seats.find((e) => e.seat === selected.value)
                          );
                          setData("search_seat", selected.value);
                          scrollRef.current[selected.value]?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "end",
                          });
                        }
                        setData("search_seat", selected);
                      }}
                    />
                  </div>
                  {election && (
                    <div className="grid lg:flex lg:flex-col grid-flow-col grid-rows-3 h-[394px] lg:h-full overflow-x-auto lg:overflow-y-auto">
                      {seats.map((seat) => (
                        <div
                          ref={(ref) => {
                            scrollRef && (scrollRef.current[seat.seat] = ref);
                          }}
                          key={seat.seat}
                          className="pl-px pr-3 pt-3"
                        >
                          <div
                            className={clx(
                              "flex flex-col h-full w-full gap-2 p-3 text-sm",
                              "bg-white dark:bg-zinc-900 lg:hover:dark:bg-zinc-900/50 lg:active:bg-slate-100 lg:active:dark:bg-zinc-900",
                              "border border-slate-200 dark:border-zinc-800 lg:hover:border-slate-400 lg:dark:hover:border-zinc-700",
                              "rounded-xl focus:outline-none",
                              data.seat &&
                                seat.seat === data.seat.seat &&
                                "lg:ring-primary lg:dark:ring-primary-dark lg:ring-1 lg:hover:border-transparent"
                            )}
                            onClick={() => {
                              setData("seat", seat);
                              setData("search_seat", seat.seat);
                              fetchSeatResult(seat.seat);
                            }}
                          >
                            <div className="flex justify-between">
                              <div className="flex w-[224px] gap-2">
                                <span className="text-zinc-500 text-sm font-medium">
                                  {seat.seat.slice(0, 5)}
                                </span>
                                <span className="truncate">
                                  {seat.seat.slice(5)}
                                </span>
                              </div>

                              <button
                                className="text-zinc-500 flex flex-row items-center text-sm font-medium hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:hover:text-white lg:hidden"
                                onClick={() => {
                                  setShow(true);
                                }}
                              >
                                <ArrowsPointingOutIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex h-8 items-center gap-1.5">
                              <ImageWithFallback
                                className="border-slate-200 dark:border-zinc-800 rounded border"
                                src={`/static/images/parties/${seat.party}.png`}
                                width={32}
                                height={18}
                                alt={t(`${seat.party}`)}
                                style={{
                                  width: "auto",
                                  maxWidth: "32px",
                                  height: "auto",
                                  maxHeight: "32px",
                                }}
                              />
                              <span className="truncate font-medium">{`${seat.name} `}</span>
                              <span>{`(${seat.party})`}</span>
                              <Won />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <p className="text-zinc-500 text-sm">
                                {t("majority")}
                              </p>
                              <BarPerc
                                hidden
                                value={seat.majority_perc}
                                size="h-[5px] w-[30px] xl:w-[50px]"
                              />
                              <span>
                                {seat.majority === null
                                  ? `—`
                                  : numFormat(seat.majority, "standard")}
                                {seat.majority_perc === null
                                  ? ` (—)`
                                  : ` (${numFormat(
                                      seat.majority_perc,
                                      "compact",
                                      1
                                    )}%)`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
              right={
                <div className="hidden h-[600px] w-full space-y-8 overflow-y-auto rounded-r-xl bg-white p-8 dark:bg-zinc-900 lg:block">
                  {data.seat_result.data.length > 0 && election ? (
                    <BallotCard />
                  ) : (
                    <></>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </div>

      <Transition show={show} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-30"
          onClose={() => setShow(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-900 bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={clx(
                    "border-slate-200 dark:border-zinc-700 w-full max-w-4xl transform rounded-xl border bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-zinc-900"
                  )}
                >
                  <BallotCard />

                  <button
                    className="hover:bg-slate-100 dark:hover:bg-zinc-800 group absolute right-3 top-5 h-8 w-8 rounded-full md:right-5 md:top-6"
                    onClick={() => setShow(false)}
                  >
                    <XMarkIcon className="text-zinc-500 mx-auto h-6 w-6" />
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Section>
  );
};

export default BallotSeat;
