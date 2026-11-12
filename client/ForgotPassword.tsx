import React, { useEffect, useState } from "react";

import AlertPanel from "./SiteComponents/AlertPanel";

import { useAppDispatch } from "./hooks";
import { requestPasswordReset } from "./ReduxActions/auth";
import { rejectionMessage } from "./util";
import { getRecaptchaToken, loadRecaptcha } from "./recaptcha";

type ValidationMap = Record<string, string>;

export function ForgotPassword() {
    const dispatch = useAppDispatch();
    const [username, setUsername] = useState("");
    const [validation, setValidation] = useState<ValidationMap>({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Load early: reCAPTCHA v3 scores the visit, and the submit doesn't wait for the script.
        loadRecaptcha().catch(() => {});
    }, []);

    const verifyUsername = () => {
        const newValidation = { ...validation };
        delete newValidation["username"];

        if(!username || username === "") {
            newValidation["username"] = "Please enter your username";
        }

        setValidation(newValidation);
        return newValidation;
    };

    const onSubmit = (event: React.MouseEvent) => {
        event.preventDefault();
        getRecaptchaToken("submit").then(async (token: string) => {
            setError("");

            const newValidation: ValidationMap = {};
            if(!username || username === "") {
                newValidation["username"] = "Please enter your username";
            }
            setValidation(newValidation);

            if(Object.values(newValidation).some((message) => message && message !== "")) {
                setError("Please complete the fields and try again");
                return;
            }

            setSubmitting(true);

            try {
                await dispatch(requestPasswordReset({ username, captcha: token })).unwrap();
                setSubmitting(false);
                setSuccess("Your request was submitted, if you have an account, an email will have been sent to the address you used to register with more instructions. This request could end up in your Spam folder, so make sure to check there if you do not see it.");
            } catch(err) {
                setSubmitting(false);
                setError(rejectionMessage(err, "Could not communicate with the server.  Please try again later."));
            }
        }, () => {
            setError("Could not load the captcha. Please check your connection and try again.");
        });
    };

    const fields = [
        {
            name: "username",
            label: "Username",
            placeholder: "Username",
            inputType: "text",
            blurCallback: verifyUsername
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
                <label htmlFor={ field.name } className="col-sm-3 col-lg-2 control-label">{ field.label }</label>
                <div className="col-sm-6">
                    <input
                        type={ field.inputType }
                        className="form-control"
                        id={ field.name }
                        placeholder={ field.placeholder }
                        value={ field.name === "username" ? username : "" }
                        onChange={ (e) => setUsername(e.target.value) }
                        onBlur={ field.blurCallback }
                    />
                    { validationMessage }
                </div>
            </div>
        );
    });

    if(success) {
        return <div><div className="alert alert-success" role="alert">{ success }</div></div>;
    }

    const errorBar = error ? <div className="alert alert-danger" role="alert">{ error }</div> : null;

    return (
        <div>
            { errorBar }
            <AlertPanel type="info" message="To start the password recovery process, please enter your username and click the submit button." />
            <div className="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
                <div className="panel-title">
                    Forgot password
                </div>
                <div className="panel">
                    <form className="form form-horizontal">
                        { fieldsToRender }
                        <div className="form-group">
                            <div className="col-sm-offset-3 col-lg-offset-2 col-sm-3">
                                { submitting ? (
                                    <button type="submit" className="btn btn-primary" disabled>Submitting...</button>
                                ) : (
                                    <button type="submit" className="btn btn-primary" onClick={ onSubmit }>Submit</button>
                                ) }
                            </div>
                        </div>
                    </form>
                    <p className="small text-muted">This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy">Privacy Policy</a> and <a href="https://policies.google.com/terms">Terms of Service</a> apply.</p>
                </div>
            </div>
        </div>
    );
}

ForgotPassword.displayName = "ForgotPassword";

export default ForgotPassword;
