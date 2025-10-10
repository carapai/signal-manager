import { QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import type { Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

interface UseDexieInfiniteTableQueryOptions<T> {
    table: Table<T, any>;
    fetchFn: (page: number) => Promise<{
        events: T[];
        pager: {
            page: number;
            isLastPage: boolean;
        };
    }>;
    queryKey: QueryKey;
    filterFn?: (item: T) => boolean;
}

export const nextAction = (values: any) => {
    if (values.dataValues?.["VaO1WnueBpu"]) {
        return { next: "", active: ["0", "1", "2", "3"] };
    }
    if (values.dataValues?.["FidiishnZJZ"] === "Discard") {
        return { next: "", active: ["0", "1", "2"] };
    }
    if (values.dataValues?.["FidiishnZJZ"] === "Alert") {
        return { next: "3", active: ["0", "1", "2", "3"] };
    }
    if (values.dataValues?.["RZMTtSyhdHY"] === "Discard") {
        return { next: "", active: ["0", "1"] };
    }
    if (values.dataValues?.["RZMTtSyhdHY"] === "Relevant") {
        return { next: "2", active: ["0", "1", "2"] };
    }
    return { next: "1", active: ["0", "1"] };
};

export const currentStatus = (values: any) => {
    if (values.dataValues?.["VaO1WnueBpu"]) {
        if (values.dataValues?.["x84ZTtD0Z8u"]) {
            if (values.dataValues?.["x84ZTtD0Z8u"] === "Low") {
                return { text: "Closed", color: "green" };
            }
            if (values.dataValues?.["x84ZTtD0Z8u"] === "Moderate") {
                return { text: "Under Monitoring", color: "blue" };
            }
            if (values.dataValues?.["x84ZTtD0Z8u"] === "High") {
                return { text: "Actioned", color: "orange" };
            }
            if (values.dataValues?.["x84ZTtD0Z8u"] === "Very High") {
                return { text: "Critical", color: "crimson" };
            }
            return { text: "Closed", color: "green" };
        }
        return { text: "Assessed", color: "green" };
    }
    if (values.dataValues?.["FidiishnZJZ"] === "Discard") {
        return { text: "Verified", color: "red" };
    }
    if (values.dataValues?.["FidiishnZJZ"] === "Alert") {
        return { text: "Alerted", color: "orange" };
    }
    if (values.dataValues?.["RZMTtSyhdHY"] === "Relevant") {
        return { text: "Reviewed", color: "blue" };
    }

    if (values.dataValues?.["RZMTtSyhdHY"] === "Discard") {
        if (values.dataValues?.["LxWNKdd93lq"] === "Yes") {
            return { text: "Duplicate", color: "red" };
        }
        return { text: "Triaged", color: "gray" };
    }
    return { text: "New", color: "gray" };
};
export const signalLevel = (values: any) => {
    const { x84ZTtD0Z8u: riskLevel } = values.dataValues;
    console.log("Risk level:", riskLevel);
    if (riskLevel === "Very High") {
        return "crimson";
    }
    if (riskLevel === "High") {
        return "red";
    }
    if (riskLevel === "Moderate") {
        return "orange";
    }
    if (riskLevel === "Low") {
        return "yellow";
    }
    return "";
};

export function useDexieInfiniteTableQuery<T>({
    table,
    fetchFn,
    queryKey,
    filterFn,
}: UseDexieInfiniteTableQueryOptions<T>) {
    const query = useInfiniteQuery({
        queryKey,
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetchFn(pageParam);
            if (res.events?.length) {
                await table.bulkPut(res.events);
            }
            return res;
        },
        getNextPageParam: (lastPage, allPages) =>
            lastPage.pager.isLastPage ? undefined : allPages.length + 1,
        refetchOnWindowFocus: false,
    });
    const localData = useLiveQuery(async () => {
        const coll = filterFn
            ? table.orderBy("lastUpdated").filter(filterFn).reverse()
            : table.orderBy("lastUpdated").reverse();
        return coll.toArray();
    }, [filterFn]);
    return {
        data: localData ?? [],
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        isFetching: query.isFetching,
    };
}
