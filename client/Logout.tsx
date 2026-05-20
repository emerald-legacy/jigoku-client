import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "./hooks";
import { logoutUser } from "./ReduxActions/auth";

function Logout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(logoutUser()).finally(() => navigate("/"));
    }, [dispatch, navigate]);

    return <div>Logging out, please wait while you are redirected</div>;
}

Logout.displayName = "Logout";

export default Logout;
