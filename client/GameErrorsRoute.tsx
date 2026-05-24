import React from "react";

const GameErrorsAdmin = React.lazy(() => import("./GameErrorsAdmin"));
const Unauthorised = React.lazy(() => import("./Unauthorised"));

export default function GameErrorsRoute({ canView }: { canView: boolean }) {
    return (
        <React.Suspense fallback={ <div className="errors-route-loading">Loading game errors&hellip;</div> }>
            { canView ? <GameErrorsAdmin /> : <Unauthorised /> }
        </React.Suspense>
    );
}
