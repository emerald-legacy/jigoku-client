import { Link } from "react-router-dom";

function Unauthorised() {
    return (
        <div className="col-xs-12">
            <div className="panel-title text-center">No access</div>
            <div className="panel error-page">
                <p>You don&apos;t have access to this page.</p>
                <Link className="btn btn-primary" to="/">Back to the lobby</Link>
            </div>
        </div>
    );
}

Unauthorised.displayName = "Unauthorised";

export default Unauthorised;
