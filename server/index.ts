Bun.serve({
    port: "3000",
    routes: {
        "/ws": (req, server) => {
            if (req.url === "/ws") {
                // upgrade the request to a WebSocket
                if (server.upgrade(req)) {
                    return; // do not return a Response
                }
                return new Response("Upgrade failed", { status: 500 });
            }
        },
    },
    fetch (req, server) {
        const path = req.url.split("/").slice(3, Infinity).join("/");
        console.log(path)
        return new Response(Bun.file(path === "" ? "../dist/index.html" : "../dist/" + path))
    },
    websocket: {
        message(ws, message) { }, // a message is received
        open(ws) {
            console.log("open")
        }, // a socket is opened
        close(ws, code, message) { }, // a socket is closed
        drain(ws) { }, // the socket is ready to receive more data
    }, // handlers
});
console.log("Serving")