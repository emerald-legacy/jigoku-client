function Community() {
    return (
        <div className='col-xs-12 full-height'>
            <div className='panel-title text-center'>
                Jigoku Online - Community Information
            </div>
            <div className='panel about-container'>
                <h3>What is this page?</h3>
                <p>This page is a shoutout to other works/resources in the L5R community.</p>

                <h3>L5R Discord</h3>
                <p>Link: <a href='https://discord.gg/zPvBePb' target='_blank' rel='noopener noreferrer'>L5R Discord</a></p>
                <p>Discord is a text and voice communicaton application. Created by members of the L5R subreddit, it's a robust community of LCG/CCG/RPG players.</p>

                <h3>Emerald DB</h3>
                <p>Link: <a href='https://www.emeralddb.org/' target='_blank' rel='noopener noreferrer'>Emerald DB</a></p>
                <p>Card database and deck builder. Contains card rulings as well. Deck list are able to be directly imported into the Deckbuilder here. Successor to FiveRingsDB.</p>

                <h3>Discord League</h3>
                <p>Link: <a href='https://discord-league.herokuapp.com' target='_blank' rel='noopener noreferrer'>Discord League</a></p>
                <p>
                    A competitive league, with a friendly tournament running each month. Sign up with your Discord account, and also
                    <a href='https://discord.gg/mfpZTqxxah' target='_blank' rel='noopener noreferrer'>join the Discord server where the games are scheduled</a>.
                </p>

                <h3>The Lotus Pavilion</h3>
                <p>Link: <a href='https://l5r.tourneygrounds.com' target='_blank' rel='noopener noreferrer'>The Lotus Pavilion</a></p>
                <p>Browser-based tournament software that originated for AGOT 2.0. Has an excellent pedigree.</p>

                <h3>The Ringteki Dev Discord</h3>
                <p>Link: <a href='https://discord.gg/tMzhyND' target='_blank' rel='noopener noreferrer'>Ringteki Discord</a></p>
                <p>If you're interested in helping develop Ringteki, or you have a bug to report, feel free to contact us here.</p>
            </div>
        </div>
    );
}

Community.displayName = 'Community';

export default Community;
