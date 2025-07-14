import { ServerGame } from "./server_game.ts";
const game = new ServerGame();

Bun.serve({
    port: "3000",
    routes: {
        "/ws": (req, server) => {
            // upgrade the request to a WebSocket
            if (server.upgrade(req)) {
                return; // do not return a Response
            }
            return new Response("Upgrade failed", { status: 500 });
        },
    },
    fetch (req, server) {
        console.log(req.url);
        const path = req.url.split("/").slice(3, Infinity).join("/");
        console.log(path)
        return new Response(Bun.file(path === "" ? "../dist/index.html" : "../dist/" + path))
    },
    websocket: {
        message(ws, message) {
            const player = game.getPlayer(ws)!;
            if (typeof message !== "string") return;
            const packet = JSON.parse(message);
            game.receivePacket(player, packet);
        }, // a message is received
        open(ws) {
            console.log("open")
            game.addPlayer(ws);
        }, // a socket is opened
        close(ws, code, message) {
            console.log("close", code, message)
            game.removePlayer(ws);
        }, // a socket is closed
        drain(ws) { }, // the socket is ready to receive more data
    }, // handlers
});
console.log("Serving")