import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="col-xs-12">
            <div className="panel-title text-center">Page not found</div>
            <div className="panel error-page">
                <p>There is no page at this address.</p>
                <Link className="btn btn-primary" to="/">Back to the lobby</Link>
            </div>
        </div>
    );
}

NotFound.displayName = "NotFound";

export default NotFound;
