import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import {
    Button,
    DatePicker,
    Flex,
    Input,
    InputRef,
    Space,
    Table,
    TableColumnType,
    TableProps,
    Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import SignalModal from "../components/signal-modal";
import { db } from "../db";
import { EventWithValues, SMSSearchParams } from "../types";
import { nextAction, signalLevel, useDexieInfiniteTableQuery } from "../utils";
import { RootRoute } from "./__root";

import {
    LoadingOutlined,
    Loading3QuartersOutlined,
    SearchOutlined,
} from "@ant-design/icons";

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
        const { dates } = SignalsRoute.useSearch();
        const splitDates = dates?.split(",");
        return (
            <Flex vertical gap={20} style={{ width: "100%" }}>
                <Typography.Title level={4} style={{ padding: 0, margin: 0 }}>
                    Signals
                </Typography.Title>
                <Flex
                    gap={10}
                    style={{ width: "50%", backgroundColor: "aqua" }}
                    align="center"
                >
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
    validateSearch: SMSSearchParams,
});

export const SignalsIndexRoute = createRoute({
    getParentRoute: () => SignalsRoute,
    path: "/",
    component: SignalsRouteComponent,
});

function SignalsRouteComponent() {
    const [open, setOpen] = useState(false);
    const { engine, queryClient } = SignalsRoute.useRouteContext();
    const { programStageDataElements } = useLoaderData({ from: "__root__" });
    const search = SignalsRoute.useSearch();
    const dataElements = Array.from(programStageDataElements.values()).filter(
        (de) => de.displayInReports,
    );
    const [actions, setActions] = useState<ReturnType<typeof nextAction>>({
        next: "1",
        active: ["0", "1", "2"],
    });

    const filterFn = useMemo(() => {
        if (!search.dates) return undefined;
        const [start, end] = search.dates.split(",").map((d) => dayjs(d));
        return (item: EventWithValues) => {
            const lastUpdated = dayjs(item.lastUpdated);
            return lastUpdated.isAfter(start) && lastUpdated.isBefore(end);
        };
    }, [search.dates]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
        useDexieInfiniteTableQuery<EventWithValues>({
            table: db.events,
            fetchFn: async (page) => {
                let params: Record<string, string | number> = {
                    page,
                    programStage: "Nnnqw1XKpZL",
                    ouMode: "ALL",
                    order: "lastUpdated:desc",
                };
                if (search.dates && search.dates?.split(",").length > 1) {
                    const [lastUpdatedStartDate, lastUpdatedEndDate] =
                        search.dates.split(",");
                    params = {
                        ...params,
                        lastUpdatedStartDate,
                        lastUpdatedEndDate,
                    };
                }
                const response = await engine.query({
                    events: {
                        resource: "events",
                        params,
                    },
                });

                const eventsData = response.events as {
                    events: Array<{
                        programStage: string;
                        programType: string;
                        orgUnit: string;
                        program: string;
                        event: string;
                        status: string;
                        orgUnitName: string;
                        eventDate: string;
                        created: string;
                        lastUpdated: string;
                        deleted: boolean;
                        attributeOptionCombo: string;
                        dataValues: Array<{
                            dataElement: string;
                            value: string;
                        }>;
                        notes: unknown[];
                    }>;
                    pager: {
                        page: number;
                        pageSize: number;
                        isLastPage: boolean;
                    };
                };

                const transformedEvents: EventWithValues[] =
                    eventsData.events.map(({ dataValues, ...event }) => {
                        const dataValuesMap: Record<string, string | null> = {};
                        for (const dv of dataValues) {
                            dataValuesMap[dv.dataElement] = dv.value;
                        }
                        return {
                            ...event,
                            dataValues: dataValuesMap,
                        };
                    });

                return {
                    events: transformedEvents,
                    pager: eventsData.pager,
                };
            },
            queryKey: ["signals", search.q, search.dates],
            filterFn,
        });

    useEffect(() => {
        const container = document.querySelector(".ant-table-body");
        if (!container) return;

        const handleScroll = () => {
            if (
                container.scrollTop + container.clientHeight >=
                container.scrollHeight
            ) {
                if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    const [currentEvent, setCurrentEvent] = useState<EventWithValues | null>(
        null,
    );
    const all: Array<(typeof dataElements)[number] & { compulsory: boolean }> =
        [
            {
                formName: "Event Date",
                name: "Event Date",
                id: "eventDate",
                compulsory: true,
                code: "eventDate",
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
    const performAction = (
        event: EventWithValues,
        action: ReturnType<typeof nextAction>,
    ) => {
        setCurrentEvent(() => event);
        setActions(() => action);
        setOpen(() => true);
    };

    const [searchText, setSearchText] = useState("");
    const [searchedColumn, setSearchedColumn] = useState("");
    const searchInput = useRef<InputRef>(null);

    const handleSearch = (
        selectedKeys: string[],
        confirm: () => void,
        dataIndex: keyof EventWithValues,
    ) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters?: () => void) => {
        clearFilters?.();
        setSearchText("");
    };

    const getColumnSearchProps = (
        dataIndex: (typeof dataElements)[number],
    ): TableColumnType<EventWithValues> => {
        let filterDropdown = undefined;

        if (
            dataIndex.valueType === "DATE" ||
            dataIndex.valueType === "DATETIME"
        ) {
            filterDropdown = ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
                close,
            }: any) => (
                <div
                    style={{ padding: 8 }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <DatePicker
                        onChange={(date, dateString) => {
                            setSelectedKeys(dateString ? [dateString] : []);
                        }}
                        value={selectedKeys[0] ? dayjs(selectedKeys[0]) : null}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() =>
                                handleSearch(
                                    selectedKeys as string[],
                                    confirm,
                                    dataIndex.id as keyof EventWithValues,
                                )
                            }
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                        </Button>
                        <Button
                            onClick={() => handleReset(clearFilters)}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                close();
                            }}
                        >
                            Close
                        </Button>
                    </Space>
                </div>
            );
        } else if (dataIndex.optionSetValue === false) {
            filterDropdown = ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
            }: any) => (
                <div
                    style={{ padding: 8 }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <Input
                        ref={searchInput}
                        placeholder={`Search ${String(
                            dataIndex.formName || dataIndex.name,
                        )}`}
                        value={selectedKeys[0]}
                        onChange={(e) =>
                            setSelectedKeys(
                                e.target.value ? [e.target.value] : [],
                            )
                        }
                        onPressEnter={() =>
                            handleSearch(
                                selectedKeys as string[],
                                confirm,
                                dataIndex.id as keyof EventWithValues,
                            )
                        }
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() =>
                                handleSearch(
                                    selectedKeys as string[],
                                    confirm,
                                    dataIndex.id as keyof EventWithValues,
                                )
                            }
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                        </Button>
                        <Button
                            onClick={() => handleReset(clearFilters)}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            );
        }
        if (dataIndex.optionSetValue && dataIndex.optionSet?.options) {
            return {
                filters: dataIndex.optionSet.options.map((opt) => ({
                    text: opt.name,
                    value: opt.code,
                })),
                onFilter: (value, record) => {
                    return record.dataValues?.[dataIndex.id] === value;
                },
                onFilterDropdownOpenChange: (visible) => {
                    if (visible) {
                        setTimeout(() => searchInput.current?.select(), 100);
                    }
                },
            };
        }

        return {
            filterDropdown,
            onFilter: (value, record) => {
                return (
                    record.dataValues?.[dataIndex.id]
                        ?.toString()
                        .toLowerCase()
                        .includes((value as string).toLowerCase()) ?? false
                );
            },
            onFilterDropdownOpenChange: (visible) => {
                if (visible) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            },
        };
    };
    const columns: TableProps<EventWithValues>["columns"] = useMemo(() => {
        return all.flatMap((de) => {
            if (de.id === "actions") {
                return {
                    title: "Actions",
                    dataIndex: "actions",
                    render: (_, record) => {
                        const action = nextAction(record);
                        return (
                            <Button
                                onClick={() => performAction(record, action)}
                            >
                                {nextLabels[action.next] || "View"}
                            </Button>
                        );
                    },
                    align: "center",
                    fixed: "right",
                };
            }

            if (de.id === "eventDate") {
                return {
                    title: de.formName || de.name,
                    key: de.id,
                    render: (_, record) => {
                        return dayjs(record.eventDate).format("DD/MM/YYYY");
                    },
                    sorter: (a, b) =>
                        dayjs(a.eventDate).unix() - dayjs(b.eventDate).unix(),
                    defaultSortOrder: "descend",
                    fixed: "left",
                };
            }
            return {
                title: de.formName || de.name,
                key: de.id,
                render: (_, record) => {
                    const val =
                        record[de.id as keyof typeof record] ||
                        record.dataValues?.[de.id];

                    if (val && de.valueType === "BOOLEAN") {
                        return val === "true" ? "Yes" : "No";
                    }
                    if (
                        val &&
                        (de.valueType === "DATE" || de.valueType === "DATETIME")
                    ) {
                        return dayjs(String(val)).format("DD/MM/YYYY");
                    }
                    return String(val ?? "");
                },
                ...getColumnSearchProps(de),
            };
        });
    }, [dataElements]);
    return (
        <Flex
            vertical
            gap="10px"
            style={{
                width: "100%",
                padding: 16,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}
            align="center"
        >
            <Table
                columns={columns}
                dataSource={data}
                rowKey="event"
                pagination={false}
                scroll={{ y: "calc(100vh - 260px)", x: "max-content" }}
                loading={{
                    spinning: isFetching || isFetchingNextPage,
                    indicator: <Loading3QuartersOutlined spin />,
                }}
                onRow={(record) => ({
                    style: { backgroundColor: signalLevel(record) },
                })}
            />
            <SignalModal
                open={open}
                setOpen={(open) => setOpen(() => open)}
                onCreate={() => {}}
                actions={actions}
                values={currentEvent}
            />
        </Flex>
    );
}
