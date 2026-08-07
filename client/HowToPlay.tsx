import { Link } from "react-router-dom";

import { asset } from "./assetUrl";

type ShotProps = {
    name: string;
    alt: string;
    caption: string;
};

// Screenshots open full size in a new tab — the in-page copies are scaled down.
function Shot({ name, alt, caption }: ShotProps) {
    const url = asset(`howtoplay/${ name }.webp`);

    return (
        <figure className="htp-figure">
            <a href={ url } target="_blank" rel="noopener noreferrer">
                <img src={ url } alt={ alt } loading="lazy" />
            </a>
            <figcaption>{ caption }</figcaption>
        </figure>
    );
}

function HowToPlay() {
    return (
        <div className="col-xs-12 full-height relative">
            <div className="panel-title text-center">How To Play on Jigoku Online</div>
            <div className="panel about-container">
                <p>
                    This guide is aimed at players familiar with the Legend of the Five Rings:
                    The Card Game who want to start playing online using the Jigoku Online
                    platform. If you are new to this cardgame in general, there is a{ " " }
                    <a
                        href="https://www.youtube.com/watch?v=wTtjYzq4T54"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        helpful tutorial video
                    </a>
                    , a{ " " }
                    <a
                        href="https://images-cdn.fantasyflightgames.com/filer_public/74/46/7446c964-613e-4c01-8902-199257c5d4af/l5c01_learntoplay_web.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn To Play guide
                    </a>
                    , and a{ " " }
                    <a
                        href="https://www.emeralddb.org/rules/emerald"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Rules Reference Guide
                    </a>{ " " }
                    to help you out.
                </p>

                <section className="format-section">
                    <h3>Topics</h3>
                    <ul className="htp-main-list">
                        <li><a href="#decks">Adding Decks</a></li>
                        <li><a href="#starting">Starting a Game</a></li>
                        <li><a href="#setup">Setting Up the Board</a></li>
                        <li><a href="#layout">The Game Screen</a></li>
                        <li><a href="#playing">Playing the Game</a></li>
                        <ul className="htp-sub-list">
                            <li><a href="#dynasty">Dynasty Phase</a></li>
                            <li><a href="#draw">Draw Phase</a></li>
                            <li><a href="#conflict">Conflict Phase</a></li>
                            <li><a href="#interrupts">Interrupts, Reactions and Card Piles</a></li>
                        </ul>
                        <li><a href="#profile">Profile Options</a></li>
                        <ul className="htp-sub-list">
                            <li><a href="#action">Action Windows</a></li>
                            <li><a href="#timed">Timed Interrupt Window</a></li>
                        </ul>
                        <li><a href="#mmode">Manual Mode</a></li>
                        <li><a href="#commands">Manual Commands</a></li>
                        <li><a href="#conceding">About Stats, Conceding and Leaving Games</a></li>
                    </ul>
                </section>

                <section className="format-section">
                    <h3 id="decks">Adding Decks</h3>
                    <p>
                        Start by making sure you have created an account and are logged in. You must
                        be logged in to add decks and spectate or play games. Jigoku Online has a
                        functional <Link to="/decks">Deckbuilder</Link>, although most people use
                        the more fully featured{ " " }
                        <a target="_blank" rel="noopener noreferrer" href="https://www.emeralddb.org/">
                            Emerald DB
                        </a>{ " " }
                        deckbuilder to build their decks. After building your deck on FiveRingsDB,
                        copy the Permalink URL, paste it into popup window in the deckbuilder that is
                        brought up when you click &lsquo;Import Deck&rsquo;. You are now ready to start playing.
                        Head over to the <Link to="/play">Play</Link> section to create, join or
                        watch games.
                    </p>
                </section>

                <section className="format-section">
                    <h3 id="starting">Starting a Game</h3>
                    <p>
                        In the <Link to="/play">Play</Link> section, click &lsquo;New Game&rsquo; to create a
                        game of your own, or &lsquo;Join&rsquo; on one that is already open. The New Game
                        window lets you choose your game&rsquo;s format.
                    </p>
                    <p>
                        Both players then click the green &lsquo;Select deck...&rsquo; link to open a popup
                        window showing all of their imported decks that are legal for the game&rsquo;s
                        format.
                    </p>
                    <Shot
                        name="new-game-select-deck"
                        alt="The lobby waiting room with a green Select deck link next to each player"
                        caption="Click the green ‘Select deck...’ link next to your name."
                    />
                    <p>
                        Once both players have selected a deck, the player who set up the game can
                        click &lsquo;Start&rsquo; to begin the match.
                    </p>
                    <Shot
                        name="new-game-start"
                        alt="The waiting room showing 'Ready to begin, click start to begin the game'"
                        caption="With both decks chosen, the Start button becomes available to the game’s host."
                    />
                </section>

                <section className="format-section">
                    <h3 id="setup">Setting Up the Board</h3>
                    <p>
                        Once the game begins, your first decision after first player is determined is
                        to choose which province will be your stronghold province. Your province deck
                        is highlighted in the bottom-left of the screen &mdash; click it, click one
                        eligible province, then click &lsquo;Done&rsquo;. By default your other provinces are
                        randomised in their position in your non-stronghold province row.
                    </p>
                    <Shot
                        name="setup-stronghold-province"
                        alt="Setup phase prompt to select a stronghold province, with the province deck highlighted bottom-left"
                        caption="The setup phase prompt, with your province deck highlighted in the bottom-left."
                    />
                    <Shot
                        name="setup-province-deck"
                        alt="Province deck popup showing the five provinces, with one selected"
                        caption="Clicking the province deck opens it so you can pick your stronghold province."
                    />
                    <p>
                        You will then see your initial dynasty draw. Click any cards you wish to
                        mulligan, then click &lsquo;Done&rsquo;. Repeat the process for your conflict draw.
                    </p>
                    <div className="htp-figure-row">
                        <Shot
                            name="setup-dynasty-mulligan"
                            alt="Dynasty mulligan prompt with one selected dynasty card highlighted in green"
                            caption="Dynasty mulligan — selected cards are outlined in green."
                        />
                        <Shot
                            name="setup-conflict-mulligan"
                            alt="Conflict mulligan prompt showing the opening hand"
                            caption="Conflict mulligan, using the same selection and Done flow."
                        />
                    </div>
                </section>

                <section className="format-section">
                    <h3 id="layout">The Game Screen</h3>
                    <p>
                        The numbers below match the labels on the screenshot. Your own side of the
                        board is always at the bottom of the screen; your opponent&rsquo;s mirrors it at
                        the top.
                    </p>
                    <Shot
                        name="layout-overview"
                        alt="The Jigoku game board with eleven numbered callouts"
                        caption="Click the image to open it full size in a new tab."
                    />
                    <ol className="htp-legend">
                        <li>
                            <strong>Game Log and Chat Window</strong> &mdash; click in the text entry box at
                            the bottom to message your opponent, or to enter a manual command.
                        </li>
                        <li>
                            <strong>Manual Mode Button</strong> &mdash; if you need to correct the game state
                            for any reason, first click here.
                        </li>
                        <li>
                            <strong>Your Hand</strong> &mdash; a floating window you can move around the
                            screen by dragging and holding the green bar.
                        </li>
                        <li><strong>Your Province Row and Dynasty Cards.</strong></li>
                        <li><strong>Your Stronghold and Role Card.</strong></li>
                        <li><strong>Unclaimed Ring Pool.</strong></li>
                        <li><strong>Claimed Ring Pool</strong> (your opponent&rsquo;s).</li>
                        <li>
                            <strong>Counters</strong> for cards in hand, fate in pool and honor total
                            (your opponent&rsquo;s).
                        </li>
                        <li>
                            <strong>Conflicts Available</strong> (your opponent&rsquo;s) &mdash; how many conflicts
                            a player still has the opportunity to declare, and which conflict types
                            are available, political or military.
                        </li>
                        <li><strong>First Player Token.</strong></li>
                        <li><strong>Bid Dial.</strong></li>
                    </ol>
                </section>

                <section className="format-section">
                    <h3 id="playing">Playing the Game</h3>
                    <p>
                        At all times, click on cards in your hand or in play to play that card or
                        trigger its ability. The prompt box in the middle of the board always tells
                        you what the game is waiting for.
                    </p>

                    <h4 id="dynasty">Dynasty Phase</h4>
                    <p>
                        Click a character in your provinces to play it, and you will be prompted to
                        choose how much extra fate to place on it. Cards that are eligible to be
                        played from hand can be clicked on in the same way.
                    </p>
                    <Shot
                        name="dynasty-choose-fate"
                        alt="Dynasty phase prompt asking how much additional fate to place on a character"
                        caption="Choosing additional fate when playing a character."
                    />

                    <h4 id="draw">Draw Phase</h4>
                    <p>
                        Follow the prompts on screen to choose your honor bid for cards. You will
                        then automatically be prompted to take an action by clicking on a card in
                        hand or in play, or to pass.
                    </p>

                    <h4 id="conflict">Conflict Phase</h4>
                    <p>
                        During the conflict phase, after both players have passed, the first player
                        has the first opportunity to either declare or pass a conflict. Follow the
                        on-screen prompt to select a ring and conflict type &mdash; to switch between
                        military and political, click a selected ring a second time. Then click on
                        one of your opponent&rsquo;s provinces to attack, and on the characters you want
                        to attack with. Finally, click &lsquo;Initiate Conflict&rsquo;.
                    </p>
                    <Shot
                        name="conflict-declare"
                        alt="Declaring a conflict: a selected ring, a targeted province and a declared attacker, with the Initiate Conflict button"
                        caption="Declaring a military conflict: the ring, the attacked province and the declared attacker are all selected before initiating."
                    />

                    <h4 id="interrupts">Interrupts, Reactions and Card Piles</h4>
                    <p>
                        If one of your cards can interrupt or react to an ability that has been
                        triggered, the screen will go dark and highlight all the possible cards that
                        can respond &mdash; some of them might be in your discard pile.
                    </p>
                    <Shot
                        name="interrupt-window"
                        alt="The board darkened during an interrupt window, with the one card able to respond highlighted"
                        caption="An interrupt window: everything dims except the cards that can respond."
                    />
                    <p>
                        To see cards in a discard pile, in the removed from game area, or tucked
                        behind another card, click on the area and a popup window will open. You can
                        close the window with the &times; button in its top-right corner. You can also
                        hover your mouse over a card to see a larger image that is easier to read
                        &mdash; if you have control of a facedown card in play, hovering over it will
                        show you its other side as well.
                    </p>
                </section>

                <section className="format-section">
                    <h3 id="profile">Profile Options</h3>
                    <p>
                        Clicking your <Link to="/profile">Profile</Link> at the top right of the
                        page allows you to tailor certain aspects of gameplay to your wishes.
                    </p>

                    <h4 id="action">Action Windows</h4>
                    <p>
                        Legend of the Five Rings has quite a large number of phases and their
                        associated action windows, a number of which are not used regularly by all
                        decks. Always prompting these action windows leads to a lot of tediously
                        clicking &lsquo;Pass&rsquo;, while never prompting these action windows leads to certain
                        cards not being able to be used to their fullest extent. To solve this issue
                        you can check/uncheck any action windows in your profile to determine when
                        you&rsquo;ll be prompted or not.
                    </p>

                    <h4 id="timed">Timed Interrupt Window</h4>
                    <p>
                        The combination of automated gameplay and the ability to play reactions or
                        interrupts from hand has the potential to &ldquo;leak&rdquo; information about what your
                        opponent might hold in his or her hand. For example: if after playing an
                        event there is a pause before it resolves, you might guess correctly that was
                        due to your opponent being prompted to use Voice of Honor. To solve this
                        issue, the Timed Interrupt Window was created. Depending on which options you
                        have checked, you get a timed prompt during certain triggers asking for
                        interrupts whether you are able to interrupt these triggers or not. Now your
                        opponent experiences the same pause any time and won&rsquo;t be able to correctly
                        guess whether you&rsquo;re holding certain cards anymore.
                    </p>
                    <p>
                        There are a couple of options: you can decide whether you want to always be
                        prompted for triggered card abilities, events or both. The timer duration
                        can be modified too. Obviously, if you don&rsquo;t care about leaking cards from
                        your hand (or you don&rsquo;t play these cards anyway) and just want a quick game,
                        deselecting both options will allow for that. You will still get prompted to
                        use the aforementioned cards, but only when you actually have them.
                    </p>
                </section>

                <section className="format-section">
                    <h3 id="mmode">Manual Mode</h3>
                    <p>
                        Most of the cards should be implemented, but if things go wrong, or someone
                        misclicks, or you really hate automation, you can switch on Manual Mode by
                        typing <code>/manual</code> in chat.
                    </p>
                    <p>
                        In Manual Mode, the game will no longer resolve conflicts automatically &mdash; the
                        attacking player will be asked to indicate who won the conflict. You will
                        also get the option to use a Manual Action in action windows which puts an
                        announcement in chat and passes priority to your opponent, but won&rsquo;t have any
                        other in-game effect.
                    </p>
                    <p>
                        In manual mode, clicking cards and rings will bring up a menu which allows
                        you to easily change the game state. Most of the functions in these menus
                        mirror the Manual Commands listed below, but there are a couple of things
                        which can only be done in menus. The ring menu lets you flip a ring, which
                        you can use to change the conflict type during conflicts. You can also change
                        the contested ring by selecting the ring you want to switch to and choosing
                        the appropriate menu button. Finally, there is also an option to initiate a
                        conflict in case someone passed by accident. NB: Initiate Conflict can only
                        be used during a pre-conflict action window, and it won&rsquo;t count against your
                        conflict opportunities for the turn.
                    </p>
                </section>

                <section className="format-section">
                    <h3 id="commands">Manual Commands</h3>
                    <p>
                        The following manual commands have been implemented in order to allow for a
                        smoother gameplay experience:
                    </p>
                    <ul>
                        <li><code>/discard x</code> &mdash; Discards x cards randomly from your hand</li>
                        <li><code>/draw x</code> &mdash; Draws x cards from your deck to your hand</li>
                        <li><code>/give-control</code> &mdash; Give control of a card to your opponent. Use with caution</li>
                        <li><code>/reveal</code> &mdash; Reveal a facedown card.</li>
                        <li><code>/duel</code> &mdash; Initiates an honor bid for a duel.</li>
                        <li><code>/move-to-conflict</code> &mdash; Moves one or more characters into a conflict.</li>
                        <li><code>/send-home</code> &mdash; Sends a character home from a conflict.</li>
                        <li><code>/claim-favor x</code> &mdash; Claims the Imperial favor. x should be &lsquo;military&rsquo; or &lsquo;political&rsquo;.</li>
                        <li><code>/discard-favor</code> &mdash; Discards your Imperial favor.</li>
                        <li><code>/move-to-bottom-deck</code> &mdash; Will prompt you to select a card to move it to the bottom of its relevant deck.</li>
                        <li><code>/add-fate x</code> &mdash; Add &lsquo;x&rsquo; fate to a card.</li>
                        <li><code>/rem-fate x</code> &mdash; Remove &lsquo;x&rsquo; fate from a card.</li>
                        <li><code>/add-fate-ring ring x</code> &mdash; Add &lsquo;x&rsquo; fate to &lsquo;ring&rsquo;.</li>
                        <li><code>/rem-fate-ring ring x</code> &mdash; Remove &lsquo;x&rsquo; fate from &lsquo;ring&rsquo;.</li>
                        <li><code>/claim-ring ring</code> &mdash; Claim &lsquo;ring&rsquo;.</li>
                        <li><code>/unclaim-ring ring</code> &mdash; Set &lsquo;ring&rsquo; as unclaimed.</li>
                        <li><code>/honor</code> &mdash; Move the state of a character towards honored.</li>
                        <li><code>/dishonor</code> &mdash; Move the state of a character towards dishonored.</li>
                        <li><code>/roll x</code> &mdash; Displays a random number between 1 and x (4 by default).</li>
                        <li><code>/manual</code> &mdash; Activate or deactivate manual mode (see above).</li>
                    </ul>
                </section>

                <section className="format-section">
                    <h3 id="conceding">About Stats, Conceding, and Leaving Games</h3>
                    <p>
                        Jigoku Online does not rank and/or match players by skill level in any way.
                        There are three categories (beginner, casual and competitive) to be chosen
                        when creating a game which gives an indication of what to expect, but it
                        doesn&rsquo;t enforce anything. Even though personal stats are not being tracked,
                        most players still very much appreciate a formal concede by clicking the
                        &lsquo;Concede&rsquo; button and typing &lsquo;gg&rsquo; before leaving a game. The reality of quick
                        and anonymous online games dictates this won&rsquo;t always happen though, as
                        evidenced by regular complaining in the main lobby about people leaving
                        without conceding. Our advice is to just move on to the next game since in
                        the end, conceding or not doesn&rsquo;t really impact anything. Happy gaming!
                    </p>
                </section>
            </div>
        </div>
    );
}

HowToPlay.displayName = "How To Play";

export default HowToPlay;
