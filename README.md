# Jigoku Client

Web based implementation of The Legend of the Five Rings LCG — lobby server and React frontend.

## FAQ

### What is it?

This is the repository for the lobby server and client which is running on [jigoku.online](https://jigoku.online/) allowing people to play L5R LCG online using only their browser.

### Can I contribute?

Sure! The code is written in Node.js (server) and React (client). Feel free to make suggestions, refactor bits of the code, raise pull requests or submit bug reports.

If you are going to contribute code, try and follow the style of the existing code as much as possible and talk to me before engaging in any big refactors.

If you're not coding inclined, then just playing games on the site and reporting bugs and issues that you find is a big help.

### How do I do X Y Z?

Check out the [About page](https://jigoku.online/about) of a Jigoku live deployment.

## Development

#### Required Software
* Git
* Node.js 22+
* MongoDB 7

#### Getting Started

```
git clone <repo>
npm install
node server/scripts/fetchdata.js
node .
```

`node server/scripts/fetchdata.js` needs to be run whenever there is new card data (either new cards or updated cards). This will fetch card images for you.

`node .` starts the lobby server. The lobby will be available at http://127.0.0.1:4000/.

#### Configuration

The lobby server is configured via `config/default.json5`. Create a `config/local.json5` to override settings for your environment. Key settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `dbPath` | `mongodb://127.0.0.1:27017/ringteki` | MongoDB connection string |
| `lobbyWsUrl` | `ws://127.0.0.1:6000` | WebSocket URL the lobby listens on for game node connections |
| `secret` | — | Session secret |
| `lobby.port` | `4000` | HTTP port for the lobby server |
| `cspConnectSources` | `[]` | Additional CSP connect-src hosts for game nodes |

Some settings can also be overridden via environment variables: `DB_PATH`, `LOBBY_WS_URL`, `NODE_ENV`, `LOG_LEVEL`, `HTTPS`, `ALLOWED_ORIGINS`.

For production:

```
npm run build
NODE_ENV=production PORT=4000 node .
```

### Coding Guidelines

All code should pass linting (ESLint flat config) with no errors or warnings:

```
npm run lint
```

All tests should also pass:

```
npm test
```

If you are making any game engine changes, these will not be accepted without unit tests to cover them.

### Discord Discussion
[Jigoku Discord Server](https://discord.gg/tMzhyND)
