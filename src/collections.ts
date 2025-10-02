import { useDataEngine } from "@dhis2/app-runtime";
import { SMS, SMSSchema } from "./types";
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

export const smsQueryOptions = (engine: ReturnType<typeof useDataEngine>) =>
    queryOptions({
        queryKey: ["sms-data"],
        queryFn: async () => {
            const { sms } = (await engine.query({
                sms: {
                    resource: "sms/inbound",
                    params: {
                        pageSize: 10,
                        fields: "*",
                    },
                },
            })) as { sms: { inboundsmss: SMS[] } };
            return sms.inboundsmss;
        },
    });
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
