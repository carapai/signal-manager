import { useDataEngine } from "@dhis2/app-runtime";
import { createActorContext } from "@xstate/react";
import { assign, fromPromise, setup } from "xstate";
import {
	querySignals,
	signalsQueryOptions,
	totalSignalsQueryOptions,
} from "../collections";
import { queryClient } from "../query-client";
import { Event, SMSSearchParams } from "../types";

interface SignalContext {
    signals: Awaited<ReturnType<typeof querySignals>>["events"];
    error?: string;
    signal?: Awaited<ReturnType<typeof querySignals>>["events"][number];
    engine: ReturnType<typeof useDataEngine>;
    search: SMSSearchParams;
    total: number;
}

type SignalEvent =
    | { type: "RETRY" }
    | {
          type: "CREATE_SIGNAL";
          signal: Awaited<ReturnType<typeof querySignals>>["events"][number];
      }
    | { type: "FETCH_NEXT_PAGE"; search: SMSSearchParams }
    | {
          type: "SET_SIGNALS";
          signals: Awaited<ReturnType<typeof querySignals>>["events"];
      }
    | { type: "UPDATE_SIGNAL"; signal: Event }
    | {
          type: "SET_SIGNAL";
          signal: Awaited<ReturnType<typeof querySignals>>["events"][number];
      };
export const smsMachine = setup({
    types: {
        context: {} as SignalContext,
        events: {} as SignalEvent,
        input: {} as { engine: ReturnType<typeof useDataEngine> },
    },
    actors: {
        fetchSignals: fromPromise<
            Awaited<ReturnType<typeof querySignals>>,
            {
                engine: ReturnType<typeof useDataEngine>;
                search: SMSSearchParams;
            }
        >(async ({ input: { engine, search } }) => {
            const data = await queryClient.fetchQuery(
                signalsQueryOptions(engine, search),
            );
            return data;
        }),
        fetchTotalSignals: fromPromise<
            number,
            {
                engine: ReturnType<typeof useDataEngine>;
                dates?: string;
            }
        >(async ({ input: { engine, dates } }) => {
            const data = await queryClient.fetchQuery(
                totalSignalsQueryOptions(engine, dates),
            );
            return data;
        }),

        createSignal: fromPromise<
            Awaited<ReturnType<typeof querySignals>>["events"][number],
            {
                signal: Awaited<
                    ReturnType<typeof querySignals>
                >["events"][number];
                engine: ReturnType<typeof useDataEngine>;
            }
        >(async ({ input: { engine, signal } }) => {
            const { dataValues, ...rest } = signal;
            await engine.mutate({
                resource: "events",
                type: "create",
                data: {
                    events: [
                        {
                            ...rest,
                            dataValues: Object.entries(dataValues).flatMap(
                                ([dataElement, value]) => {
                                    if (value === undefined) return [];
                                    if (value === null) return [];
                                    return { dataElement, value };
                                },
                            ),
                        },
                    ],
                },
                params: {
                    async: false,
                },
            });

            return signal;
        }),
    },
}).createMachine({
    id: "sms",
    initial: "loading",
    context: ({ input: { engine } }) => {
        return {
            signals: [],
            engine,
            search: { page: 1, pageSize: 10, q: "" },
            total: 0,
            district: "",
        };
    },

    states: {
        loading: {
            invoke: {
                src: "fetchTotalSignals",
                input: ({ context: { engine, search } }) => {
                    return { engine, dates: search.dates };
                },
                onDone: {
                    target: "afterTotals",
                    actions: assign({
                        total: ({ event }) => event.output,
                        search: () => ({ page: 1, pageSize: 10, q: "" }),
                    }),
                },
                onError: {
                    target: "failure",
                    actions: assign({
                        error: ({ event }) =>
                            event.error instanceof Error
                                ? event.error.message
                                : String(event.error),
                        total: () => 0,
                    }),
                },
            },
        },
        afterTotals: {
            invoke: {
                src: "fetchSignals",
                input: ({ context: { engine, search } }) => {
                    return { engine, search };
                },
                onDone: {
                    target: "success",
                    actions: assign({
                        signals: ({ event }) => event.output.events,
                    }),
                },
                onError: {
                    target: "failure",
                    actions: assign({
                        error: ({ event }) =>
                            event.error instanceof Error
                                ? event.error.message
                                : String(event.error),
                    }),
                },
            },
        },

        success: {
            on: {
                CREATE_SIGNAL: {
                    guard: ({ context }) => !!context.signal,
                    target: "optimisticUpdate",
                    actions: assign({
                        signals: ({ context, event }) => {
                            return context.signals.concat(event.signal);
                        },
                    }),
                },
                SET_SIGNAL: {
                    actions: assign({
                        signal: ({ event }) => event.signal,
                    }),
                },
                FETCH_NEXT_PAGE: {
                    target: "afterTotals",
                    actions: assign({
                        search: ({ event }) => event.search,
                    }),
                },
                UPDATE_SIGNAL: {
                    guard: ({ context }) => !!context.signal,
                    target: "optimisticUpdate",
                    actions: assign({
                        signals: ({ context }) => {
                            return context.signals.map((signal) => {
                                if (
                                    context.signal &&
                                    signal.event === context.signal.event
                                ) {
                                    return {
                                        ...signal,
                                        ...context.signal,
                                    };
                                }
                                return signal;
                            });
                        },
                    }),
                },
            },
        },

        optimisticUpdate: {
            invoke: {
                src: "createSignal",
                input: ({ context }) => ({
                    signal: context.signal!,
                    engine: context.engine,
                }),
                onDone: {
                    target: "success",
                    actions: assign({
                        signals: ({ context, event }) =>
                            context.signals.map((t) =>
                                t.event === event.output.event
                                    ? event.output
                                    : t,
                            ),
                        signal: undefined,
                    }),
                },
                onError: {
                    target: "success",
                    actions: assign({
                        error: ({ event }) =>
                            event.error instanceof Error
                                ? event.error.message
                                : String(event.error),
                        signal: undefined,
                    }),
                },
            },
        },

        failure: {
            on: {
                RETRY: "loading",
            },
        },
    },
});

export const SMSContext = createActorContext(smsMachine);
