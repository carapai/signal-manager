import { QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import type { Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { ProgramRule, ProgramRuleResult, ProgramRuleVariable } from "../types";
import { Dictionary } from "lodash";

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

export const nextAction = (dataValues: Dictionary<string>) => {
    if (dataValues["VaO1WnueBpu"]) {
        return { next: "", active: ["0", "1", "2", "3"] };
    }
    if (dataValues["FidiishnZJZ"] === "Discard") {
        return { next: "", active: ["0", "1", "2"] };
    }
    if (dataValues["FidiishnZJZ"] === "Alert") {
        return { next: "3", active: ["0", "1", "2", "3"] };
    }
    if (dataValues["RZMTtSyhdHY"] === "Discard") {
        return { next: "", active: ["0", "1"] };
    }
    if (dataValues["RZMTtSyhdHY"] === "Relevant") {
        return { next: "2", active: ["0", "1", "2"] };
    }
    return { next: "0", active: ["0", "1"] };
};

export const currentStatus = (values: any) => {
    if (values.dataValues?.["VaO1WnueBpu"]) {
        return { text: "Assessed", color: "green" };
    }
    if (values.dataValues?.["FidiishnZJZ"]) {
        return { text: "Verified", color: "yellow" };
    }

    if (values.dataValues?.["RZMTtSyhdHY"]) {
        return { text: "Triaged", color: "red" };
    }
    return { text: "Open", color: "gray" };
};

export const signalStatus = (values: any) => {
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

export function getUniqueNumber() {
    const time = Date.now() % 100000; // 5 digits
    const rand = Math.floor(Math.random() * 100); // 2 digits
    return time * 100 + rand; // 7 digits max
}

export function executeProgramRules({
    programRules,
    programRuleVariables,
    dataValues,
}: {
    programRules: ProgramRule[];
    programRuleVariables: ProgramRuleVariable[];
    dataValues: Record<string, any>;
}): ProgramRuleResult {
    // Step 1: Build variable map (variable name -> actual value)
    const variableValues: Record<string, any> = {};

    for (const variable of programRuleVariables) {
        // console.log("Processing variable:", variable);
        let value: any = null;

        if (
            variable.dataElement &&
            dataValues.hasOwnProperty(variable.dataElement.id)
        ) {
            value = dataValues[variable.dataElement.id];
        }
        variableValues[variable.name] = value ?? null;
    }

    // Step 2: Safely evaluate rule condition
    const evaluateCondition = (condition: string): boolean => {
        const safeCond = condition.replace(/#\{(\w+)\}/g, (_, name) => {
            const val = variableValues[name];
            if (typeof val === "string") return `'${val}'`;
            if (val === null || val === undefined || val === "''")
                return "null";

            console.log("Variable value:", name, val);
            return val;
        });

        try {
            const value = new Function(
                `return (${safeCond.replace("!=", "!==")})`,
            )();
            return value;
        } catch (err) {
            console.warn(`Invalid condition: ${condition}`, safeCond);
            return false;
        }
    };

    // Step 3: Run through rules and collect actions
    const result: ProgramRuleResult = {
        assignments: {},
        hiddenFields: new Set(),
        shownFields: new Set(),
        messages: [],
        warnings: [],
    };

    for (const rule of programRules) {
        const isTrue = evaluateCondition(rule.condition);
        if (!isTrue) continue;
        for (const action of rule.programRuleActions) {
            switch (action.programRuleActionType) {
                case "ASSIGN":
                    action.dataElement &&
                        (result.assignments[action.dataElement.id] =
                            action.value);
                    break;
                case "HIDEFIELD":
                    action.dataElement &&
                        result.hiddenFields.add(action.dataElement.id);
                    break;
                case "SHOWFIELD":
                    action.dataElement &&
                        result.shownFields.add(action.dataElement.id);
                    break;
                case "DISPLAYTEXT":
                    if (action.value) result.messages.push(action.value);
                    break;
                case "ERROR":
                    if (action.value)
                        result.messages.push(`Error: ${action.value}`);
                    break;
                case "SHOWWARNING":
                    if (action.value) result.warnings.push(action.value);
                    break;
            }
        }
    }

    return result;
}
