import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute, Outlet } from "@tanstack/react-router";
import React from "react";
import { smsQueryOptions } from "../collections";
import { RootRoute } from "./__root";
import {
    Button,
    Flex,
    Input,
    Space,
    Table,
    Typography,
    type TableProps,
} from "antd";
import { SMS, SMSSearchParams } from "../types";

export const SMSRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/sms",
    component: () => {
        const navigate = SMSRoute.useNavigate();
        return (
            <Flex vertical gap={10} style={{ width: "100%" }}>
                <Typography.Title level={2} style={{ padding: 0, margin: 0 }}>
                    SMS Messages
                </Typography.Title>
                <Input.Search
                    placeholder="Search SMS"
                    style={{ marginBottom: 10, width: 300 }}
                    onSearch={(value) =>
                        navigate({
                            search: (prev) => ({ ...prev, q: value, page: 1 }),
                        })
                    }
                />
                <Outlet />
            </Flex>
        );
        ``;
    },
    validateSearch: SMSSearchParams,
});

export const SMSIndexRoute = createRoute({
    getParentRoute: () => SMSRoute,
    path: "/",
    component: SMSRouteComponent,
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient, engine }, deps }) => {
        return queryClient.ensureQueryData(smsQueryOptions(engine, deps));
    },
});

function SMSRouteComponent() {
    const { engine } = SMSRoute.useRouteContext();
    const search = SMSRoute.useSearch();
    const { data } = useSuspenseQuery(smsQueryOptions(engine, search));
    const handleForward = (sms: SMS) => {
        console.log("Forwarding SMS:", sms);
    };

    const columns: TableProps<SMS>["columns"] = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Message",
            dataIndex: "text",
            key: "message",
        },
        {
            title: "Originator",
            dataIndex: "originator",
            key: "originator",
        },
        {
            title: "Received Date",
            dataIndex: "receiveddate",
            key: "timestamp",
        },
        {
            title: "Actions",
            dataIndex: "actions",
            key: "actions",
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => handleForward(record)}>
                        Forward
                    </Button>
                </Space>
            ),
            width: 50,
            align: "center",
        },
    ];
    return <Table columns={columns} dataSource={data} rowKey="id" bordered />;
}
