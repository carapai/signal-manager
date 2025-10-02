import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import React from "react";
import { smsQueryOptions } from "../collections";
import { RootRoute } from "./__root";

export const IndexRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/",
    component: IndexRouteComponent,

    loader: (opts) =>
        opts.context.queryClient.ensureQueryData(
            smsQueryOptions(opts.context.engine),
        ),
});

function IndexRouteComponent() {
    const { engine } = IndexRoute.useRouteContext();
    const { data } = useSuspenseQuery(smsQueryOptions(engine));
    return (
        <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
