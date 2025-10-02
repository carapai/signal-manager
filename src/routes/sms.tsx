import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import React from "react";
import { smsQueryOptions } from "../collections";
import { RootRoute } from "./__root";

export const SMSRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/sms",
    component: SMSRouteComponent,

    loader: (opts) =>
        opts.context.queryClient.ensureQueryData(
            smsQueryOptions(opts.context.engine),
        ),
});

function SMSRouteComponent() {
    const { engine } = SMSRoute.useRouteContext();
    const { data } = useSuspenseQuery(smsQueryOptions(engine));
    return (
        <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
