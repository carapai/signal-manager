import { createRoute, Outlet } from "@tanstack/react-router";
import { Card, DatePicker, Flex } from "antd";
import dayjs from "dayjs";
import React from "react";
import { SMSSearchParams } from "../types";
import { RootRoute } from "./__root";

import { CalendarOutlined, FilterOutlined } from "@ant-design/icons";

export const SignalsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/signals",
    component: () => {
        const navigate = SignalsRoute.useNavigate();
        const { dates } = SignalsRoute.useSearch();
        const splitDates = dates?.split(",");
        return (
            <Flex
                vertical
                gap={16}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            >
                <Card
                    variant="borderless"
                    style={{
                        background:
                            "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    styles={{ body: { padding: 16 } }}
                >
                    <Flex gap={16} align="center">
                        <FilterOutlined
                            style={{ fontSize: 18, color: "#667eea" }}
                        />
                        <DatePicker.RangePicker
                            onChange={(_, dateStrings) =>
                                navigate({
                                    search: (prev) => ({
                                        ...prev,
                                        dates:
                                            dateStrings.length > 0 &&
                                            dateStrings.filter((a) => a)
                                                .length > 0
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
                                    ? [
                                          dayjs(splitDates[0]),
                                          dayjs(splitDates[1]),
                                      ]
                                    : undefined
                            }
                            style={{ minWidth: 300 }}
                            prefix={<CalendarOutlined />}
                        />
                    </Flex>
                </Card>
                <Outlet />
            </Flex>
        );
    },
    validateSearch: SMSSearchParams,
});
