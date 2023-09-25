import ElectionAnalysis from "./analysis";
import BallotSeat from "./ballot-seat";
import ElectionFilter from "./filter";
import { ElectionEnum, OverallSeat, Party, PartyResult } from "../types";
import { BuildingLibraryIcon, FlagIcon } from "@heroicons/react/24/solid";
import { get } from "@lib/api";
import {
  Button,
  Container,
  Dropdown,
  Hero,
  Label,
  List,
  Modal,
  Section,
  StateDropdown,
  toast,
} from "@components/index";
import { CountryAndStates } from "@lib/constants";
import { WindowProvider } from "@lib/contexts/window";
import { useCache } from "@hooks/useCache";
import { useData } from "@hooks/useData";
import { useFilter } from "@hooks/useFilter";
import { useTranslation } from "@hooks/useTranslation";
import { useScrollIntersect } from "@hooks/useScrollIntersect";
import { OptionType } from "@lib/types";
import dynamic from "next/dynamic";
import { FunctionComponent, useMemo, useRef } from "react";
import Overview from "./overview";

/**
 * Election Explorer Dashboard
 * @overview Status: In-development
 */

const Toast = dynamic(() => import("@components/Toast"), { ssr: false });

interface ElectionExplorerProps {
  choropleth: any;
  last_updated: string;
  params: {
    state: string;
    election: string;
  };
  seats: OverallSeat[];
  selection: Record<string, any>;
  table: PartyResult;
}

const ElectionExplorer: FunctionComponent<ElectionExplorerProps> = ({
  choropleth,
  last_updated,
  params,
  seats,
  selection,
  table,
}) => {
  const { t } = useTranslation(["common", "elections", "election"]);
  const { cache } = useCache();

  const divRef = useRef<HTMLDivElement>(null);
  useScrollIntersect(divRef.current, "drop-shadow-xl");

  const PANELS = [
    {
      name: t("parlimen"),
      icon: <BuildingLibraryIcon className="mr-1 h-5 w-5" />,
    },
    {
      name: t("state"),
      icon: <FlagIcon className="mr-1 h-5 w-5" />,
    },
  ];

  const { filter, setFilter } = useFilter({
    election: params.election,
    state: params.state,
  });

  const ELECTION_FULLNAME = filter.election ?? "GE-15";
  const ELECTION_ACRONYM = ELECTION_FULLNAME.slice(-5);
  const CURRENT_STATE = filter.state ?? "mys";

  const { data, setData } = useData({
    toggle_index: ELECTION_ACRONYM.startsWith("G")
      ? ElectionEnum.Parlimen
      : ElectionEnum.Dun,
    tab_index: 0,
    election_fullname: ELECTION_FULLNAME,
    election_acronym: ELECTION_ACRONYM,
    state: CURRENT_STATE,
    showFullTable: false,
    seats: seats,
    table: table,
  });

  const TOGGLE_IS_DUN = data.toggle_index === ElectionEnum.Dun;
  const TOGGLE_IS_PARLIMEN = data.toggle_index === ElectionEnum.Parlimen;
  const NON_SE_STATE = ["mys", "kul", "lbn", "pjy"];

  const GE_OPTIONS: Array<OptionType> = selection["mys"]
    .map((election: Record<string, any>) => ({
      label: t(election.name, { ns: "election" }) + ` (${election.year})`,
      value: election.name,
    }))
    .reverse();

  const SE_OPTIONS = useMemo<Array<OptionType>>(() => {
    let _options: Array<OptionType> = [];
    if (data.state !== null && NON_SE_STATE.includes(data.state) === false)
      _options = selection[data.state]
        .map((election: Record<string, any>) => ({
          label: t(election.name, { ns: "election" }) + ` (${election.year})`,
          value: election.name,
        }))
        .reverse();
    return _options;
  }, [data.state]);

  const fetchResult = async (
    _election: string,
    state: string
  ): Promise<{ seats: OverallSeat[]; table: Party[] }> => {
    setData("loading", true);
    setFilter("election", _election);
    setFilter("state", state);
    const identifier = `${state}_${_election}`;

    const election =
      _election.startsWith("S") &&
      state &&
      ["mys", "kul", "lbn", "pjy"].includes(state) === false
        ? `${CountryAndStates[state]} ${_election}`
        : _election;
    setData("election_fullname", election);

    return new Promise((resolve) => {
      if (cache.has(identifier)) {
        setData("loading", false);
        return resolve(cache.get(identifier));
      }

      Promise.all([
        get("/explorer", {
          explorer: "ELECTIONS",
          chart: "overall_seat",
          election,
          state,
        }),
        get("/explorer", {
          explorer: "ELECTIONS",
          chart: "full_result",
          type: "party",
          election,
          state,
        }),
      ])
        .then(
          ([{ data: _seats }, { data: _table }]: [
            { data: { data: OverallSeat[] } },
            { data: { data: Party[] } },
          ]) => {
            const elections = {
              seats: _seats.data,
              table: _table.data.sort((a, b) => {
                if (a.seats.won === b.seats.won) {
                  return b.votes.perc - a.votes.perc;
                } else {
                  return b.seats.won - a.seats.won;
                }
              }),
            };
            cache.set(identifier, elections);
            setData("loading", false);
            return resolve(elections);
          }
        )
        .catch((e) => {
          toast.error(t("toast.request_failure"), t("toast.try_again"));
          console.error(e);
        });
    });
  };

  const handleElectionTab = (index: number) => {
    //  When toggling to DUN, if state is Malaysia / W.P, set as null, else set as current state
    if (index === ElectionEnum.Dun) {
      setData(
        "state",
        NON_SE_STATE.includes(filter.state ?? "mys")
          ? null
          : data.state || CURRENT_STATE
      );
      setData("election", null);
    } else {
      setData("state", data.state || CURRENT_STATE);
    }
    setData("toggle_index", index);
  };

  return (
    <>
      <Toast />
      <Hero
        background="red"
        category={[t("category"), "text-danger"]}
        header={[t("header")]}
        description={[t("description")]}
        last_updated={last_updated}
      />
      <Container>
        {/* Explore any election from Merdeka to the present! */}
        <Section className="pt-8 lg:pt-12">
          <h4 className="text-center">{t("header_1", { ns: "elections" })}</h4>

          {/* Mobile */}
          <Modal
            trigger={(open) => (
              <WindowProvider>
                <ElectionFilter onClick={open} />
              </WindowProvider>
            )}
            title={
              <Label label={t("filters") + ":"} className="text-sm font-bold" />
            }
          >
            {(close) => (
              <div className="flex flex-col">
                <div className="bg-white dark:bg-zinc-900">
                  <div className="dark:divide-washed-dark divide-y px-3 pb-3">
                    <div className="space-y-2 py-3">
                      <Label
                        label={t("election", { ns: "elections" }) + ":"}
                        className="text-sm"
                      />
                      <div className="border-slate-200 dark:border-zinc-800 max-w-fit rounded-full border bg-white p-1 dark:bg-zinc-900">
                        <List
                          options={PANELS.map((item) => item.name)}
                          icons={PANELS.map((item) => item.icon)}
                          current={data.toggle_index}
                          onChange={handleElectionTab}
                        />
                      </div>
                    </div>
                    <div className="dark:border-zinc-700 grid grid-cols-2 gap-2 border-y py-3">
                      <Label label={t("state") + ":"} className="text-sm" />
                      <Label
                        label={t("election_year", { ns: "elections" }) + ":"}
                        className="text-sm"
                      />
                      <StateDropdown
                        currentState={data.state}
                        onChange={(selected) => {
                          setData("state", selected.value);
                          TOGGLE_IS_DUN && setData("election_acronym", null);
                        }}
                        exclude={TOGGLE_IS_DUN ? NON_SE_STATE : []}
                        width="w-full"
                        anchor="bottom-10"
                      />
                      <Dropdown
                        width="w-full"
                        anchor="right-0 bottom-10"
                        placeholder={t("select_election", { ns: "elections" })}
                        options={TOGGLE_IS_PARLIMEN ? GE_OPTIONS : SE_OPTIONS}
                        selected={
                          TOGGLE_IS_PARLIMEN
                            ? GE_OPTIONS.find(
                                (e) => e.value === data.election_acronym
                              )
                            : SE_OPTIONS.find(
                                (e) => e.value === data.election_acronym
                              )
                        }
                        disabled={!data.state}
                        onChange={(selected) =>
                          setData("election_acronym", selected.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="dark:border-washed-dark flex w-full flex-col gap-2 border-t bg-white p-3 dark:bg-black">
                    <Button
                      className="btn-primary w-full justify-center"
                      onClick={() => {
                        fetchResult(data.election_acronym, data.state).then(
                          ({ seats, table }) => {
                            setData("seats", seats);
                            setData("table", table);
                            close();
                          }
                        );
                      }}
                    >
                      {t("filter")}
                    </Button>
                    <Button
                      className="btn w-full justify-center px-3 py-1.5"
                      onClick={close}
                    >
                      {t("close")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Desktop */}
          <div
            ref={divRef}
            className="sticky top-16 z-20 mt-6 hidden items-center gap-2 lg:flex mx-auto w-fit"
          >
            <div className="border-slate-200 dark:border-zinc-800 max-w-fit rounded-full border bg-white p-1 dark:bg-zinc-900">
              <List
                options={PANELS.map((item) => item.name)}
                icons={PANELS.map((item) => item.icon)}
                current={data.toggle_index}
                onChange={handleElectionTab}
              />
            </div>
            <StateDropdown
              currentState={data.state}
              onChange={(selected) => {
                TOGGLE_IS_PARLIMEN && data.election_acronym
                  ? fetchResult(data.election_acronym, selected.value).then(
                      ({ seats, table }) => {
                        setData("seats", seats);
                        setData("table", table);
                      }
                    )
                  : setData("election_acronym", null);
                setData("state", selected.value);
              }}
              exclude={TOGGLE_IS_DUN ? NON_SE_STATE : []}
              width="w-fit"
              anchor="left"
            />
            <Dropdown
              anchor="left"
              placeholder={t("select_election", { ns: "elections" })}
              options={TOGGLE_IS_PARLIMEN ? GE_OPTIONS : SE_OPTIONS}
              selected={
                TOGGLE_IS_PARLIMEN
                  ? GE_OPTIONS.find((e) => e.value === data.election_acronym)
                  : SE_OPTIONS.find((e) => e.value === data.election_acronym)
              }
              onChange={(selected) => {
                setData("election_acronym", selected.value);
                fetchResult(selected.value, data.state).then(
                  ({ seats, table }) => {
                    setData("seats", seats);
                    setData("table", table);
                  }
                );
              }}
              disabled={!data.state}
            />
          </div>

          <Overview
            choropleth={choropleth}
            filter={filter}
            table={data.table}
          />
          <hr className="dark:border-zinc-800 border-slate-200 pt-8 h-px lg:pt-12"></hr>

          {/* View the full ballot for a specific seat */}
          <BallotSeat
            election={data.election_fullname}
            seats={data.seats}
            state={filter.state ?? "mys"}
          />
          <hr className="dark:border-zinc-800 border-slate-200 h-px"></hr>

          {/* Election analysis */}
          <ElectionAnalysis
            choropleth={choropleth}
            seats={data.seats}
            state={filter.state ?? "mys"}
            toggle={data.toggle_index}
          />
        </Section>
      </Container>
    </>
  );
};

export default ElectionExplorer;
