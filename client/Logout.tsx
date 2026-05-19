import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "./hooks";
import * as actions from "./actions";

function Logout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        axios.post("/api/account/logout")
            .finally(() => {
                dispatch(actions.logout());
                navigate("/");
            });
    }, [dispatch, navigate]);

    return <div>Logging out, please wait while you are redirected</div>;
}

Logout.displayName = "Logout";

export default Logout;
