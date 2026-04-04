
function Avatar({ emailHash, float, forceDefault }) {
    let className = "gravatar";

    if(float) {
        className += " pull-left";
    }

    return (
        <img
            className={ className }
            src={ `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=24${forceDefault ? "&f=y" : ""}` }
        />
    );
}

Avatar.displayName = "Avatar";

export default Avatar;
