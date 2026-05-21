function Formats() {
    return (
        <div className="col-xs-12 full-height relative">
            <div className="panel-title text-center">
                Game Formats
            </div>
            <div className="panel about-container">
                <h2>What formats can be played via Jigoku Online?</h2>
                <p>
                    During its initial run under FFG, and continuation via the Emerald Legacy community-led project,
                    Legend of the Five Rings has accumulated several different game formats, which are still played to
                    varying degrees today on Jigoku.
                </p>

                <section className="format-section">
                    <h3>
                        Emerald
                        <span className="format-badge format-badge-emerald">Emerald</span>
                        <span className="format-meta">Current &amp; Supported Format</span>
                    </h3>
                    <p>
                        When FFG announced they would stop releasing content for the game, the community formed a group to
                        take over stewardship called Emerald Legacy. This project continues to publish new cards and
                        maintains game balance through periodically updated{ " " }
                        <a href="https://www.emeralddb.org/rules/organized-play/emerald" target="_blank" rel="noopener noreferrer">Restricted and Banned Card Lists</a>.
                        It also introduced a few rule changes to the game in the interests of competitive balance, including
                        limits on stacking attachments, deckbuilding restrictions for cards with the Rally keyword, and
                        removing dynasty phase &lsquo;passing fate&rsquo;.{ " " }
                        <a href="https://emeraldlegacy.org/" target="_blank" rel="noopener noreferrer">Learn more about Emerald Legacy on their website</a>.
                    </p>
                    <p>
                        The card pool for Emerald games incorporates all new cards from Emerald Legacy, plus FFG cards that
                        have not yet been rotated from the game with new releases. This is the most common format for how
                        the game is played today.
                    </p>
                </section>

                <section className="format-section">
                    <h3>
                        Sanctuary
                        <span className="format-badge format-badge-sanctuary">Sanctuary</span>
                        <span className="format-meta">Current &amp; Supported Format</span>
                    </h3>
                    <p>
                        Since the release of the Emerald Core Set, it has been possible to play the game using only cards
                        from the continuation project. This format is known as Sanctuary, after the name of the island home
                        of the great clans in exile in the{ " " }
                        <a href="https://emeraldlegacy.org/lore/story/" target="_blank" rel="noopener noreferrer">Emerald Legacy fiction</a> releases.
                        Sanctuary currently has no Restricted and Banned Card List. It uses all the same rules as the
                        Emerald format.
                    </p>
                    <p>
                        The card pool for Sanctuary games incorporates only cards from Emerald Legacy. This is a useful
                        starting-point for new players especially, with a smaller and more manageable number of cards in the
                        environment.
                    </p>
                </section>

                <section className="format-section">
                    <h3>
                        Obsidian Heresy
                        <span className="format-badge format-badge-obsidian">Obsidian</span>
                        <span className="format-meta">Current &amp; Supported Format</span>
                    </h3>
                    <p>
                        The Obsidian Heresy is an alternative format to Emerald that incorporates almost all cards ever
                        released. Obsidian maintains a{ " " }
                        <a href="https://obsidianheresy.blogspot.com/p/the-banned-cards.html" target="_blank" rel="noopener noreferrer">Banned Card List</a>{ " " }
                        of exactly 13 cards, with no Restricted Card List. It follows Emerald format where rules have been
                        changed compared to the FFG rule-set.{ " " }
                        <a href="https://obsidianheresy.blogspot.com/" target="_blank" rel="noopener noreferrer">Learn more about the Obsidian Heresy on their website</a>.
                    </p>
                    <p>
                        The card pool for Obsidian is all FFG cards, and all Emerald Legacy cards except those in the
                        mini-pack Restoration of Balance (which mostly duplicate with errata FFG cards that are legal in
                        this format). To offset the higher power level, an additional deck-building rule limits all cards
                        that are usually 3-per-deck, to a 2-per-deck maximum.
                    </p>
                </section>

                <section className="format-section">
                    <h3>
                        Stronghold
                        <span className="format-badge format-badge-imperial">Stronghold</span>
                        <span className="format-meta">FFG Completed Format</span>
                    </h3>
                    <p>
                        The main competitive format of the game under FFG, Stronghold is also known as Imperial format,
                        taking its name from The Imperial Law &mdash; the{ " " }
                        <a href="https://www.emeralddb.org/rules/organized-play/standard" target="_blank" rel="noopener noreferrer">FFG Restricted and Banned Card List</a>.
                        New cards are no longer released for this format, and the Imperial Law will no longer be updated.
                    </p>
                    <p>
                        The card pool for Stronghold games includes only FFG cards. Some players still prefer to play this
                        generally higher power-level environment with the original rule-set.
                    </p>
                </section>

                <section className="format-section">
                    <h3>
                        Skirmish
                        <span className="format-badge format-badge-skirmish">Skirmish</span>
                        <span className="format-meta">FFG Completed Format</span>
                    </h3>
                    <p>
                        Skirmish was a simplified, faster-paced format released by FFG. It changed many core rules of the
                        game, including removing strongholds and replacing provinces with tokens, and reducing the flow of
                        resources in the game. The goal of Skirmish was to have an easier-to-learn and faster-to-play
                        version of the game. The format was released in these two articles:{ " " }
                        <a href="https://www.fantasyflightgames.com/en/news/2020/3/20/legend-of-the-five-rings-skirmish-part-1/" target="_blank" rel="noopener noreferrer">part 1</a>,
                        and{ " " }
                        <a href="https://www.fantasyflightgames.com/en/news/2020/3/27/legend-of-the-five-rings-skirmish-part-2/" target="_blank" rel="noopener noreferrer">part 2</a>.
                    </p>
                    <p>
                        The card pool for Skirmish games includes only FFG cards with some additional restrictions. Many
                        cards, due to their text, do not function properly in Skirmish.
                    </p>
                </section>
            </div>
        </div>
    );
}

Formats.displayName = "Formats";

export default Formats;
