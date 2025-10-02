import { useDataEngine } from "@dhis2/app-runtime";
import { ProgramSection, SMS, SMSSchema, SMSSearchParams } from "./types";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient, queryOptions } from "@tanstack/react-query";

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
    searchParams: SMSSearchParams = { page: 1, pageSize: 10, q: "" },
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
                query.append("filter", `text:like:${q}`);
                query.append("filter", `originator:like:${q}`);
                query.append("rootJunction", "OR");
            }
            const { sms } = (await engine.query({
                sms: {
                    resource: `sms/inbound?${query.toString()}`,
                },
            })) as { sms: { inboundsmss: SMS[] } };
            return sms.inboundsmss;
        },
    });
};
export const signalsQueryOptions = (engine: ReturnType<typeof useDataEngine>) =>
    queryOptions({
        queryKey: ["signals-data"],
        queryFn: async () => {
            const { events } = (await engine.query({
                events: {
                    resource: "tracker/events",
                    params: {
                        pageSize: 10,
                        ouMode: "ALL",
                    },
                },
            })) as { events: { instances: Event[] } };
            return events.instances;
        },
    });
export const initialQueryOptions = (engine: ReturnType<typeof useDataEngine>) =>
    queryOptions({
        queryKey: ["initial-data"],
        queryFn: async () => {
            const { programStageSections } = (await engine.query({
                programStageSections: {
                    resource: `programStages/Nnnqw1XKpZL/programStageSections.json`,
                    params: {
                        fields: "name,sortOrder,description,displayName,dataElements[id,code,displayName,formName]",
                    },
                },
            })) as {
                programStageSections: {
                    programStageSections: ProgramSection[];
                };
            };
            return programStageSections.programStageSections;
        },
    });
