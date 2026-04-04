import { useState } from "react";
import axios from "axios";

import { connect } from "react-redux";
import AlertPanel from "./SiteComponents/AlertPanel.jsx";

import * as actions from "./actions";

export function InnerResetPassword({ id, token, navigate }) {
    const [password, setPassword] = useState("");
    const [password1, setPassword1] = useState("");
    const [validation, setValidation] = useState({});
    const [error, setError] = useState("");

    const verifyPassword = (isSubmitting, currentPassword, currentPassword1) => {
        const newValidation = { ...validation };
        delete newValidation["password"];

        if(currentPassword.length < 6) {
            newValidation["password"] = "The password you specify must be at least 6 characters long";
        }

        if(isSubmitting && !currentPassword1) {
            newValidation["password"] = "Please enter your password again";
        }

        if(currentPassword && currentPassword1 && currentPassword !== currentPassword1) {
            newValidation["password"] = "The passwords you have specified do not match";
        }

        setValidation(newValidation);
        return newValidation;
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        setError("");

        // Do synchronous validation
        const newValidation = {};
        if(password.length < 6) {
            newValidation["password"] = "The password you specify must be at least 6 characters long";
        }
        if(!password1) {
            newValidation["password"] = "Please enter your password again";
        }
        if(password && password1 && password !== password1) {
            newValidation["password"] = "The passwords you have specified do not match";
        }
        setValidation(newValidation);

        if(Object.values(newValidation).some((message) => message && message !== "")) {
            setError("There was an error in one or more fields, please see below, correct the error and try again");
            return;
        }

        try {
            const response = await axios.post("/api/account/password-reset-finish", {
                id: id,
                token: token,
                newPassword: password
            });

            if(!response.data.success) {
                setError(response.data.message);
                return;
            }

            navigate("/login");
        } catch{
            setError("Could not communicate with the server.  Please try again later.");
        }
    };

    if(!id || !token) {
        return <AlertPanel type="error" message="This page is not intended to be viewed directly.  Please click on the link in your email to reset your password" />;
    }

    const fields = [
        {
            name: "password",
            label: "New Password",
            placeholder: "Password",
            inputType: "password",
            value: password,
            onChange: setPassword,
            blurCallback: () => verifyPassword(false, password, password1)
        },
        {
            name: "password1",
            label: "New Password (again)",
            placeholder: "Password (again)",
            inputType: "password",
            value: password1,
            onChange: setPassword1,
            blurCallback: () => verifyPassword(false, password, password1)
        }
    ];

    const fieldsToRender = fields.map((field) => {
        let className = "form-group";
        let validationMessage = null;

        if(validation[field.name]) {
            className += " has-error";
            validationMessage = <span className="help-block">{ validation[field.name] }</span>;
        }

        return (
            <div key={ field.name } className={ className }>
                <label htmlFor={ field.name } className="col-sm-2 control-label">{ field.label }</label>
                <div className="col-sm-3">
                    <input
                        type={ field.inputType }
                        className="form-control"
                        id={ field.name }
                        placeholder={ field.placeholder }
                        value={ field.value }
                        onChange={ (e) => field.onChange(e.target.value) }
                        onBlur={ field.blurCallback }
                    />
                    { validationMessage }
                </div>
            </div>
        );
    });

    const errorBar = error ? <AlertPanel type="error" message={ error } /> : null;

    return (
        <div>
            { errorBar }
            <form className="form form-horizontal">
                { fieldsToRender }
                <div className="form-group">
                    <div className="col-sm-offset-2 col-sm-3">
                        <button type="submit" className="btn btn-primary" onClick={ onSubmit }>Submit</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
InnerResetPassword.displayName = "ResetPassword";

function mapStateToProps() {
    return {};
}

const ResetPassword = connect(mapStateToProps, actions)(InnerResetPassword);

export default ResetPassword;
