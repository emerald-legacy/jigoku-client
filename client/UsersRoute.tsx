import React from "react";

const UserAdmin = React.lazy(() => import("./UserAdmin"));
const Unauthorised = React.lazy(() => import("./Unauthorised"));

export default function UsersRoute({ canManage }: { canManage: boolean }) {
    return canManage ? <UserAdmin /> : <Unauthorised />;
}
