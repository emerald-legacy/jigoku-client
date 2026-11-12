// reCAPTCHA is only needed on the password reset page, so its script is loaded there on
// demand instead of blocking every page.
const siteKey = "6LdO-NMsAAAAAOetW0LZ70BAf12jY5Om101J9As2";

let loading: Promise<void> | undefined;

export function loadRecaptcha(): Promise<void> {
    loading ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            script.remove();
            loading = undefined;
            reject(new Error("Could not load reCAPTCHA"));
        };
        document.head.appendChild(script);
    });
    return loading;
}

export async function getRecaptchaToken(action: string): Promise<string> {
    await loadRecaptcha();
    return new Promise<string>((resolve, reject) => {
        grecaptcha.ready(() => {
            grecaptcha.execute(siteKey, { action }).then(resolve, reject);
        });
    });
}
