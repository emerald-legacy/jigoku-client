
import Province from "./Province.jsx";
import Placeholder from "./Placeholder.jsx";
import CardPile from "./CardPile.jsx";

function StrongholdRow({
    cardSize,
    isMe,
    isSkirmish,
    onCardClick,
    onDragDrop,
    onMenuItemClick,
    onMouseOut,
    onMouseOver,
    otherPlayer,
    spectating,
    strongholdProvinceCards,
    thisPlayer
}) {
    const getFavor = (player) => {
        return (
            <div
                className={ `card-wrapper imperial-favor vertical ${cardSize} ${
                    player && player.imperialFavor ? "" : "hidden"
                }` }
            >
                { player && (
                    <img
                        className={ `card-image imperial-favor ${cardSize} ${
                            player.imperialFavor ? "" : "hidden"
                        } ` }
                        src={
                            "/img/" +
                            (player.imperialFavor ? player.imperialFavor : "political") +
                            "-favor.jpg"
                        }
                    />
                ) }
            </div>
        );
    };

    const getFaction = (player) => {
        if(player.faction) {
            const faction = player.faction.name.toLowerCase();
            const tokens = faction.split(" ");
            return tokens[0];
        }
        return "crab";
    };

    const getStronghold = (player, isSkirmishGame) => {
        if(!isSkirmishGame) {
            if(isMe) {
                return (
                    <Province
                        isMe={ isMe }
                        source="stronghold province"
                        cards={ strongholdProvinceCards }
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onDragDrop={ onDragDrop }
                        size={ cardSize }
                        onCardClick={ onCardClick }
                        onMenuItemClick={ onMenuItemClick }
                    />
                );
            }
            return (
                <Province
                    isMe={ isMe }
                    source="stronghold province"
                    cards={ strongholdProvinceCards }
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onCardClick={ onCardClick }
                    size={ cardSize }
                />
            );
        }
        if(player && getFaction(player)) {
            return (
                <div className={ `card-wrapper skirmish-stronghold vertical ${cardSize}` }>
                    <img
                        className={ `card-image skirmish-stronghold ${cardSize}` }
                        src={
                            "/img/skirmish-images/skirmish-stronghold-" +
                            getFaction(player) +
                            ".jpg"
                        }
                    />
                </div>
            );
        }
    };

    if(isMe || (spectating && !otherPlayer)) {
        let shClass = "player-stronghold-row our-side";
        if(thisPlayer && thisPlayer.imperialFavor) {
            shClass += " favor";
        }
        return (
            <div className={ shClass }>
                { thisPlayer && thisPlayer.role && thisPlayer.role.location ? (
                    <CardPile
                        className="rolecard"
                        source="role card"
                        cards={ [thisPlayer.role] }
                        topCard={ thisPlayer.role }
                        disableMenu
                        onMouseOver={ onMouseOver }
                        onMouseOut={ onMouseOut }
                        onCardClick={ onCardClick }
                        size={ cardSize }
                    />
                ) : (
                    <Placeholder size={ cardSize } />
                ) }
                { getStronghold(thisPlayer, isSkirmish) }
                { getFavor(thisPlayer) }
            </div>
        );
    }

    let shClass = "player-stronghold-row their-side";
    if(otherPlayer && otherPlayer.imperialFavor) {
        shClass += " favor";
    }
    return (
        <div className={ shClass }>
            { getFavor(otherPlayer) }
            { getStronghold(otherPlayer, isSkirmish) }
            { otherPlayer && otherPlayer.role && otherPlayer.role.location ? (
                <CardPile
                    className="rolecard"
                    source="role card"
                    cards={ [otherPlayer.role] }
                    topCard={ otherPlayer.role }
                    disableMenu
                    onMouseOver={ onMouseOver }
                    onMouseOut={ onMouseOut }
                    onCardClick={ onCardClick }
                    size={ cardSize }
                />
            ) : (
                <Placeholder size={ cardSize } />
            ) }
        </div>
    );
}

StrongholdRow.displayName = "StrongholdRow";

export default StrongholdRow;
