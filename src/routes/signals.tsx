import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import React from "react";
import { signalsQueryOptions } from "../collections";
import { RootRoute } from "./__root";

export const SignalsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/signals",
    component: SignalsRouteComponent,

    loader: (opts) =>
        opts.context.queryClient.ensureQueryData(
            signalsQueryOptions(opts.context.engine),
        ),
});

function SignalsRouteComponent() {
    const { engine } = SignalsRoute.useRouteContext();
    const { data } = useSuspenseQuery(signalsQueryOptions(engine));
    return (
        <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
