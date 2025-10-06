import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import {
    Button,
    DatePicker,
    Flex,
    Input,
    Table,
    TableProps,
    Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { signalsQueryOptions } from "../collections";
import SignalModal from "../components/signal-modal";
import { SMSSearchParams } from "../types";
import { RootRoute } from "./__root";
import { nextAction } from "../utils";

const nextLabels: Record<string, string> = {
    "0": "Create Signal",
    "1": "Triage Signal",
    "2": "Verify Signal",
    "3": "Assess Risk",
    "4": "Archived",
};

export const SignalsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/signals",
    component: () => {
        const navigate = SignalsRoute.useNavigate();
        const { dates, q } = SignalsRoute.useSearch();
        const splitDates = dates?.split(",");
        return (
            <Flex vertical gap={20} style={{ width: "100%" }}>
                <Typography.Title level={4} style={{ padding: 0, margin: 0 }}>
                    Signals
                </Typography.Title>
                <Flex gap={10} style={{ width: "50%" }} align="center">
                    <Typography.Title
                        level={5}
                        style={{ padding: 0, margin: 0 }}
                    >
                        Filters
                    </Typography.Title>
                    <Input.Search
                        placeholder="Search Signals"
                        style={{ flex: 1 }}
                        onSearch={(value) =>
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    q: value,
                                    page: 1,
                                }),
                            })
                        }
                    />
                    <DatePicker.RangePicker
                        style={{ flex: 1 }}
                        onChange={(_, dateStrings) =>
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    dates:
                                        dateStrings.length > 0 &&
                                        dateStrings.filter((a) => a).length > 0
                                            ? dateStrings.join(",")
                                            : undefined,
                                    page: 1,
                                }),
                            })
                        }
                        value={
                            splitDates &&
                            splitDates?.length > 1 &&
                            splitDates.filter((a) => a).length > 0
                                ? [dayjs(splitDates[0]), dayjs(splitDates[1])]
                                : undefined
                        }
                    />
                </Flex>
                <Outlet />
            </Flex>
        );
    },
    loader: (opts) =>
        opts.context.queryClient.ensureQueryData(
            signalsQueryOptions(opts.context.engine),
        ),
    validateSearch: SMSSearchParams,
});

export const SignalsIndexRoute = createRoute({
    getParentRoute: () => SignalsRoute,
    path: "/",
    component: SignalsRouteComponent,
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient, engine }, deps }) => {
        return queryClient.ensureQueryData(signalsQueryOptions(engine, deps));
    },
});

function SignalsRouteComponent() {
    const [open, setOpen] = useState(false);
    const { engine } = SignalsRoute.useRouteContext();
    const { programStageDataElements } = useLoaderData({ from: "__root__" });
    const search = SignalsRoute.useSearch();
    const { data } = useSuspenseQuery(signalsQueryOptions(engine, search));
    const navigate = SignalsIndexRoute.useNavigate();
    const dataElements = Array.from(programStageDataElements.values()).filter(
        (de) => de.displayInReports,
    );
    const [actions, setActions] = useState<ReturnType<typeof nextAction>>({
        next: "1",
        active: ["1", "2"],
    });
    const all: Array<(typeof dataElements)[number] & { compulsory: boolean }> =
        [
            {
                formName: "OccurredAt",
                name: "Occurred At",
                id: "occurredAt",
                compulsory: true,
                code: "occurredAt",
                valueType: "TEXT",
                optionSet: {
                    options: [],
                },
                optionSetValue: false,
                displayInReports: true,
            },
            ...dataElements,
            {
                formName: "Actions",
                name: "actions",
                id: "actions",
                compulsory: true,
                code: "actions",
                valueType: "TEXT",
                optionSet: {
                    options: [],
                },
                optionSetValue: false,
                displayInReports: true,
            },
        ];
    const performAction = (action: ReturnType<typeof nextAction>) => {
        setActions(() => action);
        setOpen(() => true);
    };
    const columns: TableProps<(typeof data.events)[number]>["columns"] =
        useMemo(() => {
            return all.flatMap((de) => {
                if (de.id === "actions") {
                    return {
                        title: "Actions",
                        dataIndex: "actions",
                        render: (_, record) => {
                            const action = nextAction(record);
                            return (
                                <Button onClick={() => performAction(action)}>
                                    {nextLabels[action.next] || "View"}
                                </Button>
                            );
                        },
                        width: 50,
                        align: "center",
                        fixed: "right",
                    };
                }
                return {
                    title: de.formName || de.name,
                    dataIndex: de.id,
                };
            });
        }, []);
    return (
        <Flex vertical gap="10px" style={{ width: "100%" }} align="center">
            <Table
                columns={columns}
                dataSource={data.events}
                rowKey="event"
                scroll={{ x: "max-content" }}
                bordered
                pagination={{
                    total: data.pager.total,
                    current: search.page,
                    pageSize: search.pageSize,
                    onChange: (page, pageSize) => {
                        if (pageSize !== search.pageSize) {
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    page: 1,
                                    pageSize,
                                }),
                            });
                            return;
                        } else {
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    page,
                                }),
                            });
                        }
                    },
                }}
            />
            <SignalModal
                open={open}
                setOpen={(open) => setOpen(() => open)}
                onCreate={() => {}}
                actions={actions}
            />
        </Flex>
    );
}
