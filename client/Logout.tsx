import { useEffect } from "react";
import axios from "axios";
import { useAppDispatch } from "./hooks";
import * as actions from "./actions";

function Logout() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        axios.post("/api/account/logout")
            .finally(() => {
                dispatch(actions.logout());
                dispatch(actions.navigate("/"));
            });
    }, [dispatch]);

    return <div>Logging out, please wait while you are redirected</div>;
}

Logout.displayName = "Logout";

export default Logout;
