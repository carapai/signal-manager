import { useDataEngine } from "@dhis2/app-runtime";
import { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Link,
	Outlet,
} from "@tanstack/react-router";
import { Flex } from "antd";
import React from "react";

import { AppstoreOutlined, MailOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { initialQueryOptions } from "../collections";

type MenuItem = Required<MenuProps>["items"][number];

export const RootRoute = createRootRouteWithContext<{
    queryClient: QueryClient;
    engine: ReturnType<typeof useDataEngine>;
}>()({
    component: RootComponent,

    loader: (opts) => {
        return opts.context.queryClient.ensureQueryData(
            initialQueryOptions(opts.context.engine),
        );
    },
});

const items: MenuItem[] = [
    {
        key: "dashboard",
        label: <Link to="/">Dashboard</Link>,
        icon: <MailOutlined />,
    },
    {
        key: "sms",
        label: <Link to="/sms">SMS</Link>,
        icon: <MailOutlined />,
    },
    {
        key: "signals",
        label: <Link to="/signals">Signals</Link>,
        icon: <AppstoreOutlined />,
    },
];

function RootComponent() {
    return (
        <Flex>
            <Flex>
                <Menu style={{ width: 256 }} mode="inline" items={items} />
            </Flex>
            <Flex
                style={{
                    flex: 1,
                    height: "calc(100vh - 48px)",
                    overflow: "auto",
                    padding: 10,
                }}
            >
                <Outlet />
            </Flex>
        </Flex>
    );
}
