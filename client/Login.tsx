import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AlertPanel from "./SiteComponents/AlertPanel";

import { useAppDispatch } from "./hooks";
import { loginUser } from "./ReduxActions/auth";

type ValidationMap = Record<string, string>;

export function Login() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [validation, setValidation] = useState<ValidationMap>({});
    const [error, setError] = useState("");

    const verifyUsername = () => {
        const newValidation = { ...validation };
        delete newValidation["username"];

        if(!username || username === "") {
            newValidation["username"] = "Please enter your username";
        }

        setValidation(newValidation);
        return newValidation;
    };

    const verifyPassword = () => {
        const newValidation = { ...validation };
        delete newValidation["password"];

        if(!password || password === "") {
            newValidation["password"] = "Please enter your password";
        }

        setValidation(newValidation);
        return newValidation;
    };

    const onLogin = async (event: React.MouseEvent) => {
        event.preventDefault();

        setError("");

        const newValidation: ValidationMap = {};
        if(!username || username === "") {
            newValidation["username"] = "Please enter your username";
        }
        if(!password || password === "") {
            newValidation["password"] = "Please enter your password";
        }
        setValidation(newValidation);

        if(Object.values(newValidation).some((message) => message && message !== "")) {
            setError("Please complete both fields and try again");
            return;
        }

        try {
            await dispatch(loginUser({ username, password })).unwrap();
            navigate("/");
        } catch(err: any) {
            setError(err?.message || "Could not communicate with the server.  Please try again later.");
        }
    };

    const fields = [
        {
            name: "username",
            label: "Username",
            placeholder: "Username",
            inputType: "text",
            value: username,
            onChange: setUsername,
            blurCallback: verifyUsername
        },
        {
            name: "password",
            label: "Password",
            placeholder: "Password",
            inputType: "password",
            value: password,
            onChange: setPassword,
            blurCallback: verifyPassword
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
                <div className="col-sm-8">
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
        <div className="col-sm-6 col-sm-offset-3">
            { errorBar }
            <div className="panel-title">
                Login
            </div>
            <div className="panel">
                <form className="form form-horizontal">
                    { fieldsToRender }
                    <div className="form-group">
                        <div className="col-sm-offset-2 col-sm-10">
                            <Link to="/forgot">Forgot your password?</Link>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-offset-2 col-sm-3">
                            <button type="submit" className="btn btn-primary" onClick={ onLogin }>Login</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

Login.displayName = "Login";

export default Login;
