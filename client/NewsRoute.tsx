import React from "react";

const NewsAdmin = React.lazy(() => import("./NewsAdmin"));
const Unauthorised = React.lazy(() => import("./Unauthorised"));

export default function NewsRoute({ canEdit }: { canEdit: boolean }) {
    return canEdit ? <NewsAdmin /> : <Unauthorised />;
}
