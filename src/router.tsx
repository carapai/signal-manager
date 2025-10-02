import { QueryClient } from "@tanstack/react-query";
import {
    createHashHistory,
    createRouter,
    ErrorComponent,
} from "@tanstack/react-router";
import { Flex, Spin } from "antd";
import React from "react";
import { RootRoute } from "./routes/__root";
import { IndexRoute } from "./routes/index";
import { SignalsRoute } from "./routes/signals";
import { SMSRoute } from "./routes/sms";

const routeTree = RootRoute.addChildren([IndexRoute, SignalsRoute, SMSRoute]);
export const router = createRouter({
    routeTree,
    defaultPendingComponent: () => (
        <Flex justify="center" align="center" style={{ height: "100%" }}>
            <Spin />
        </Flex>
    ),
    defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
    history: createHashHistory(),
    context: { queryClient: new QueryClient(), engine: undefined! },
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
});
