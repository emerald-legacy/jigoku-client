import Link from './Link.jsx';

function About() {
    return (
        <div className="col-xs-12 full-height relative">
            <div className="panel-title text-center">
                About Jigoku Online - Help and information
            </div>
            <div className="panel about-container">
                <a
                    className="btn btn-danger btn-lg pull-right"
                    target='_blank'
                    rel='noopener noreferrer'
                    href='https://github.com/emerald-legacy/jigoku-client/issues'
                >
                    Report Problems
                </a>
                <h3>What is this?</h3>

                <p>
                    This site was setup to allow you to play Legend of the Five Rings, an LCG
                    from Fantasy Flight Games (FFG) in your browser.
                </p>

                <h3>That's pretty cool! But how does any of this work?</h3>
                <p>
                    Head on over to the <Link href='/how-to-play'>How To Play guide</Link> for a
                    thorough explanation.
                </p>

                <h3>Everyone has a shiny avatar, how do I get one?</h3>
                <p>
                    This is handled by the good people at{ ' ' }
                    <a href='http://gravatar.com' target='_blank' rel='noopener noreferrer'>
                        Gravatar
                    </a>
                    . Sign up there with the same email address you did there and it should
                    appear on the site after a short while. It will also use the avatar on any
                    site that uses gravatar. Examples include github and jinteki.
                </p>

                <h3>The artwork on this site is pretty cool, where's that from?</h3>
                <p>You're right, it is pretty nice isn't it?</p>

                <p>
                    The background of the site as well as all our other clan specific backgrounds
                    are made by artists of Emerald Legacy, they also appear on our cards.
                </p>
                <p>
                    The tokens used for Spirit of the River are by{ ' ' }
                    <a
                        href='https://www.dojocreativedesign.com/l5r-cardgame'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        David Robotham
                    </a>
                    . He has a selection of L5R related merchandise, check it out{ ' ' }
                    <a
                        href='https://www.dojocreativedesign.com/shop'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        here
                    </a>
                    .
                </p>
                <p>
                    Don't want to be distracted by beautiful art during your games? In-game
                    backgrounds can be disabled from your <Link href='/profile'>Profile</Link>.
                </p>

                <h3>Can I help?</h3>
                <p>
                    Sure! The project is all written in Javascript. The server is node.js and the
                    client is React.js. The source code can be found in the&nbsp;
                    <a
                        target='_blank'
                        rel='noopener noreferrer'
                        href='http://github.com/emerald-legacy/jigoku-client'
                    >
                        GitHub Repository
                    </a>
                    . Check out the code and instructions on there on how to get started and hack
                    away! See the card implementation status list above to have a look at what
                    needs to be done. If you want to join the dev Discord, there's a link on the{ ' ' }
                    <Link href='/community'>Community</Link> page.
                </p>

                <h3>Support the Project</h3>
                <p>
                    If you enjoy the site and want to help keep it running, you can support
                    us on{ ' ' }
                    <a target='_blank' rel='noopener noreferrer' href='https://patreon.com/emeraldlegacy'>
                        Patreon
                    </a>
                    . All contributions go towards hosting and server costs.
                </p>

                <h2>Special Thanks</h2>
                <p>
                    I'd like to thank mtgred, and the whole of the jinteki.net development
                    team(except whoever decided to write the code in clojure, not you. - just
                    kidding!) as without their work to use as a guide and as inspiration, this
                    site would not be where it is today. To say jinteki is an inspiration is an
                    understatement.
                </p>
                <p>
                    I'd also like to thank cryogen and his team for their work on creating
                    throneteki, which i've based this particular application off of.
                </p>

                <h2>Additional Notes</h2>
                <p>
                    The Legend of the Five Rings living card game, the artwork and many other
                    things are all copyright Fantasy Flight Games and I make no claims of
                    ownership or otherwise of any of the artwork or trademarks. This site exists
                    for passionate fans to play a game they enjoy and augment, rather than
                    replace, the in person LCG. FFG does not endorse, support, and is not
                    involved with, this site in any way.
                </p>
            </div>
        </div>
    );
}

About.displayName = 'About';

export default About;
