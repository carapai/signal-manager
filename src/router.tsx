import { QueryClient } from "@tanstack/react-query";
import {
    createHashHistory,
    createRouter,
    ErrorComponent,
} from "@tanstack/react-router";
import { Flex, Spin, } from "antd";
import React from "react";
import { LoadingOutlined, Loading3QuartersOutlined } from "@ant-design/icons";
import { RootRoute } from "./routes/__root";
import { IndexRoute } from "./routes/index";
import { SignalsIndexRoute, SignalsRoute } from "./routes/signals";
import { SMSIndexRoute, SMSRoute } from "./routes/sms";

const routeTree = RootRoute.addChildren([
    IndexRoute,
    SignalsRoute.addChildren([SignalsIndexRoute]),
    SMSRoute.addChildren([SMSIndexRoute]),
]);
export const router = createRouter({
    routeTree,
    defaultPendingComponent: () => (
        <Flex justify="center" align="center" style={{ height: "100%" }}>
            <Spin indicator={<Loading3QuartersOutlined spin />} />
        </Flex>
    ),
    defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
    history: createHashHistory(),
    context: { queryClient: new QueryClient(), engine: undefined! },
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
});


