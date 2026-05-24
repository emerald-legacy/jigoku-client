import React from "react";

const GameErrorsAdmin = React.lazy(() => import("./GameErrorsAdmin"));
const Unauthorised = React.lazy(() => import("./Unauthorised"));

export default function GameErrorsRoute({ canView }: { canView: boolean }) {
    return canView ? <GameErrorsAdmin /> : <Unauthorised />;
}
