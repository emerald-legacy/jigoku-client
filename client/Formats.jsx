function Formats() {
    return (
        <div className="col-xs-12 full-height relative">
            <div className="panel-title text-center">
                Jigoku Online - Game Formats
            </div>
            <div className="panel about-container">
                <h2>What are the game formats?</h2>
                <p>During it's life, Legend of the Five Rings accumulated a few different game formats.</p>

                <h3>Imperial Law [FFG]</h3>
                <p>
                    The Imperial Law was the official ban and restricted lists published by Fantasy Flight Games [FFG].
                    They were released every 3 months in FFG's website, and were focused on balancing the game through a
                    combination of bans, restrictions, and erratas.
                    <a href='https://www.fantasyflightgames.com/en/news/2021/8/10/restoring-imperial-law/' target='_blank' rel='noopener noreferrer'>Check here the last Imperial Law</a>,
                    or if you curious <a href='https://www.fantasyflightgames.com/en/news/2018/5/21/maintaining-balance/' target='_blank' rel='noopener noreferrer'>check here the first Imperial Law</a>!
                </p>

                <h3>Skirmish [FFG]</h3>
                <p>
                    Skirmish was an alternative format released by FFG. It changed many core rules of the game, like getting rid of strongholds and provinces,
                    and reducing the flow of resources in the game. The goal of Skirmish was to have an easier to learn and faster to play version of L5R. The
                    format was released in these two articles:
                    <a href='https://www.fantasyflightgames.com/en/news/2020/3/20/legend-of-the-five-rings-skirmish-part-1/' target='_blank' rel='noopener noreferrer'>part 1</a>, and
                    <a href='https://www.fantasyflightgames.com/en/news/2020/3/27/legend-of-the-five-rings-skirmish-part-2/' target='_blank' rel='noopener noreferrer'>part 2</a>.
                </p>

                <h3>Emerald Legacy [Community] [current]</h3>
                <p>
                    When FFG announced they would stop releasing the game, the community formed a group to take the stewardship of the game, this group is
                    the Emerald Legacy. The Emerald Legacy continues to publish cards, and took the role of maintaining game balance through ban and restricted
                    lists. It also introduced a few rule changes to the game in regards to Rally, attachments, and covert.
                    <a href='https://emeraldlegacy.org/rules/' target='_blank' rel='noopener noreferrer'>Learn more about the Emerald Legacy in their website</a>.
                </p>

                <h3>Obsidian Heresy [Community] [current]</h3>
                <p>
                    The Obsidian Heresy is an alternative format that aims to keep L5R pure in its impurity. The Obsidian legacy maintains a short ban list,
                    and has no restricted cards. It introduces a big rule change in making the maximum ammount of copies per card in decks 2 instead of 3 copies.
                    Obsidian is a wild format, where mostly everything is possible, and fire is fought with fire. The format recommends playing matches as best of 3.
                    <a href='https://obsidianheresy.blogspot.com/2021/10/the-format.html' target='_blank' rel='noopener noreferrer'>Learn more about the Obsidian Heresy in their website</a>
                </p>


            </div>
        </div>
    );
}

Formats.displayName = 'Formats';

export default Formats;
