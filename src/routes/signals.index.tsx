import { createRoute, useLoaderData } from "@tanstack/react-router";
import {
    Button,
    Card,
    DatePicker,
    Input,
    InputRef,
    Space,
    Table,
    TableColumnType,
    TableProps,
    Tag,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import SignalModal from "../components/signal-modal";
import { db } from "../db";
import { EventWithValues } from "../types";
import {
    currentStatus,
    nextAction,
    useDexieInfiniteTableQuery,
} from "../utils";

import { Loading3QuartersOutlined, SearchOutlined } from "@ant-design/icons";
import { FilterDropdownProps } from "antd/es/table/interface";
import { SignalsRoute } from "./signals";

const nextLabels: Record<string, string> = {
    "0": "Create Signal",
    "1": "Triage Signal",
    "2": "Verify Signal",
    "3": "Assess Risk",
    "4": "Archived",
};

const riskColors: Record<string, string> = {
    "Very High": "#ff4d4f",
    High: "#ff7a45",
    Moderate: "#ffa940",
    Low: "#fadb14",
};
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
                formName: "Status",
                name: "status",
                id: "status",
                compulsory: true,
                code: "status",
                valueType: "TEXT",
                optionSet: {
                    options: [],
                },
                optionSetValue: false,
                displayInReports: true,
            },
            {
                formName: "Event Date",
                name: "Event Date",
                id: "eventDate",
                compulsory: true,
                code: "eventDate",
                valueType: "DATETIME",
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
            }: FilterDropdownProps) => (
                <div
                    style={{ padding: 8 }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <DatePicker
                        onChange={(date, dateString) => {
                            setSelectedKeys([dateString].flat());
                        }}
                        value={
                            selectedKeys[0]
                                ? dayjs(String(selectedKeys[0]))
                                : null
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
            }: FilterDropdownProps) => (
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
            if (de.id === "status") {
                return {
                    title: de.formName || de.name,
                    key: de.id,
                    render: (_, record) => {
                        const { text, color } = currentStatus(record);
                        return (
                            <Tag color={color} style={{ fontSize: 13 }}>
                                {text}
                            </Tag>
                        );
                    },
                    width: 100,
                };
            }
            if (de.id === "actions") {
                return {
                    title: "Actions",
                    dataIndex: "actions",
                    render: (_, record) => {
                        const action = nextAction(record);
                        return (
                            <Button
                                type="primary"
                                onClick={() => performAction(record, action)}
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    border: "none",
                                }}
                            >
                                {nextLabels[action.next] || "View"}
                            </Button>
                        );
                    },
                    align: "center",
                    fixed: "right",
                    width: 180,
                };
            }

            if (de.id === "eventDate") {
                return {
                    title: de.formName || de.name,
                    key: de.id,
                    render: (_, record) => {
                        return (
                            <Tag color="blue" style={{ fontSize: 13 }}>
                                {dayjs(record.eventDate).format("DD/MM/YYYY")}
                            </Tag>
                        );
                    },
                    fixed: "left",
                    width: 140,
                    ...getColumnSearchProps(de),
                };
            }

            if (de.id === "x84ZTtD0Z8u") {
                return {
                    title: de.formName || de.name,
                    key: de.id,
                    render: (_, record) => {
                        const val = record.dataValues?.[de.id];
                        return val ? (
                            <Tag
                                color={riskColors[val] || "default"}
                                style={{ fontSize: 13 }}
                            >
                                {val}
                            </Tag>
                        ) : null;
                    },
                    width: 140,
                    ...getColumnSearchProps(de),
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
                        return val === "true" ? (
                            <Tag color="success">Yes</Tag>
                        ) : (
                            <Tag color="default">No</Tag>
                        );
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
        <Card
            variant="borderless"
            style={{
                boxShadow:
                    "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
            styles={{ body: { padding: 0 } }}
        >
            <div style={{ flex: 1, overflow: "auto" }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="event"
                    pagination={false}
                    scroll={{ y: "calc(100vh - 286px)", x: "max-content" }}
                    loading={{
                        spinning: isFetching || isFetchingNextPage,
                        indicator: <Loading3QuartersOutlined spin />,
                    }}
                    size="middle"
                />
            </div>

            <SignalModal
                open={open}
                setOpen={(open) => setOpen(() => open)}
                actions={actions}
                values={currentEvent}
            />
        </Card>
    );
}
