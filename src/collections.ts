import { useDataEngine } from "@dhis2/app-runtime";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { ProgramStage, SMS, SMSSchema, SMSSearchParams } from "./types";
import { fromPairs, orderBy } from "lodash";
import { Event } from "./types";

const queryClient = new QueryClient();

export const smsCollection = (engine: ReturnType<typeof useDataEngine>) => {
    return createCollection(
        queryCollectionOptions({
            id: `sms`,
            queryKey: [`sms`],
            refetchInterval: 3000,
            queryFn: async () => {
                console.log("Fetching SMS data...");
                const { sms } = (await engine.query({
                    sms: {
                        resource: "sms/inbound",
                        params: {
                            pageSize: 10,
                            fields: "*",
                        },
                    },
                })) as { sms: { inboundsmss: SMS[] } };
                return sms?.inboundsmss ?? [];
            },
            getKey: (item) => item.id,
            schema: SMSSchema,
            queryClient,
        }),
    );
};

export const smsQueryOptions = (
    engine: ReturnType<typeof useDataEngine>,
    searchParams: SMSSearchParams = {
        page: 1,
        pageSize: 10,
        q: "",
    },
) => {
    const { page, pageSize, q } = searchParams;
    return queryOptions({
        queryKey: ["sms-data", page, pageSize, q],
        queryFn: async () => {
            const query = new URLSearchParams();
            query.append("pageSize", pageSize.toString());
            query.append("page", page.toString());
            query.append("fields", "*");

            if (q) {
                query.append("filter", `text:ilike:alert ${q}`);
                query.append("filter", `originator:like:${q}`);
                query.append("rootJunction", "OR");
            } else {
                query.append("filter", `text:ilike:alert`);
            }
            const { sms } = (await engine.query({
                sms: {
                    resource: `sms/inbound?${query.toString()}`,
                },
            })) as {
                sms: {
                    inboundsmss: SMS[];
                    pager: {
                        page: number;
                        total: number;
                        pageSize: number;
                        pageCount: number;
                    };
                };
            };

            const ids = sms.inboundsmss.map((s) => s.id);
            let events: { events: { events: Event[] } } = {
                events: { events: [] },
            };
            if (ids.length > 0) {
                events = (await engine.query({
                    events: {
                        resource: `tracker/events`,
                        params: {
                            pageSize: ids.length,
                            events: ids.join(","),
                            fields: "event",
                            programStage: "Nnnqw1XKpZL",
                        },
                    },
                })) as { events: { events: Event[] } };
            }
            return {
                ...sms,
                inboundsmss: sms.inboundsmss.map((sms) => ({
                    ...sms,
                    forwarded:
                        events.events.events.find((e) => e.event === sms.id) !==
                        undefined,
                })),
            };
        },
    });
};
export const signalsQueryOptions = (
    engine: ReturnType<typeof useDataEngine>,
    searchParams: SMSSearchParams = {
        page: 1,
        pageSize: 10,
        q: "",
        dates: "",
    },
) => {
    return queryOptions({
        queryKey: [
            "signals-data",
            searchParams.page,
            searchParams.pageSize,
            searchParams.q,
            searchParams.dates,
        ],
        queryFn: async () => {
            let params: Record<string, string | number> = {
                pageSize: searchParams.pageSize,
                page: searchParams.page,
                programStage: "Nnnqw1XKpZL",
                ouMode: "ALL",
                totalPages: "true",
            };
            if (
                searchParams.dates &&
                searchParams.dates?.split(",").length > 1
            ) {
                const [occurredAfter, occurredBefore] =
                    searchParams.dates.split(",");
                params = { ...params, occurredAfter, occurredBefore };
            }
            const { events } = (await engine.query({
                events: {
                    resource: "events",
                    params,
                },
            })) as {
                events: {
                    events: Event[];
                    pager: {
                        page: number;
                        total: number;
                        pageSize: number;
                        pageCount: number;
                    };
                };
            };

            console.log("Fetched events:", JSON.stringify(events, null, 2));
            return {
                ...events,
                events: events.events.map(({ dataValues, ...event }) => {
                    return {
                        ...event,
                        dataValues: fromPairs(
                            dataValues.map((dv) => [dv.dataElement, dv.value]),
                        ),
                    };
                }),
            };
        },
    });
};
export const initialQueryOptions = (engine: ReturnType<typeof useDataEngine>) =>
    queryOptions({
        queryKey: ["initial-data"],
        queryFn: async () => {
            const { programStage, me } = (await engine.query({
                programStage: {
                    resource: `programStages/Nnnqw1XKpZL.json`,
                    params: {
                        fields: "programStageDataElements[compulsory,displayInReports,dataElement[id,name,formName,code,valueType,optionSetValue,optionSet[options[id,name,code]]]],programStageSections[id,name,sortOrder,description,displayName,dataElements[id]]",
                    },
                },
                me: {
                    resource: "me",
                    params: { fields: "organisationUnits[id,name,level]" },
                },
            })) as {
                programStage: ProgramStage;
                me: {
                    organisationUnits: {
                        id: string;
                        name: string;
                        level: number;
                    }[];
                };
            };
            let assignedDistricts = me.organisationUnits.filter(
                (ou) => ou.level === 3,
            );
            const belowDistricts = me.organisationUnits.flatMap((ou) => {
                if (ou.level === 1) {
                    return {
                        resource: `organisationUnits/${ou.id}`,
                        params: { fields: "id,name", level: 2, paging: false },
                    };
                }
                if (ou.level === 2) {
                    return {
                        resource: `organisationUnits/${ou.id}`,
                        params: { fields: "id,name", level: 1, paging: false },
                    };
                }
                return [];
            });

            if (belowDistricts.length > 0) {
                const districtQuery = belowDistricts.reduce<any>(
                    (acc, curr, index) => {
                        if (curr) {
                            acc[`belowDistricts${index}`] = curr;
                        }
                        return acc;
                    },
                    {},
                );

                const data = (await engine.query(districtQuery)) as Record<
                    string,
                    {
                        organisationUnits: {
                            id: string;
                            name: string;
                            level: number;
                        }[];
                    }
                >;

                Object.values(data).forEach((d) => {
                    assignedDistricts = assignedDistricts.concat(
                        d.organisationUnits,
                    );
                });
            }
            return {
                ...programStage,
                programStageSections: programStage.programStageSections.map(
                    (section) => ({
                        ...section,
                        dataElements: section.dataElements.map(
                            (element) => element.id,
                        ),
                    }),
                ),
                programStageDataElements: new Map(
                    programStage.programStageDataElements.map(
                        ({ compulsory, dataElement, displayInReports }) => [
                            dataElement.id,
                            { ...dataElement, compulsory, displayInReports },
                        ],
                    ),
                ),
                assignedDistricts: orderBy(
                    assignedDistricts,
                    ["name"],
                    ["asc"],
                ).map((ou) => ({ label: ou.name, value: ou.id })),
            };
        },
    });
