import TwitchJs from "twitch-js";
import Alpine from "alpinejs";

const USERNAME = process.env.MIX_USERNAME;
const CLIENT_ID = process.env.MIX_CLIENT_ID;
const SCOPES = [
    'bits:read',
    'channel:read:redemptions',
    'channel:read:subscriptions',
];
const TOPICS = [
    'channel-bits-events-v2.<USER_ID>',
    'channel-points-channel-v1.<USER_ID>',
    'channel-subscribe-events-v1.<USER_ID>',
];
let match = null;
if ((match = document.location.hash.match(/access_token=(\w+)/)) !== null && match.length > 1) {
    localStorage.setItem('ACCESS_TOKEN', document.location.hash.match(/access_token=(\w+)/)[1]);
    console.log(`ACCESS_TOKEN: ${localStorage.getItem('ACCESS_TOKEN')}`);
}
else if (localStorage.getItem('ACCESS_TOKEN') === null ) {
    console.log(`No Access Token in storage, redirecting...`);
    window.location = 'https://id.twitch.tv/oauth2/authorize'
        + '?response_type=token'
        + `&client_id=${CLIENT_ID}`
        + '&redirect_uri=' + window.location.href
        + '&scope=' + SCOPES.join('+');
} else {
    run ();
}

async function run() {
    //TODO Switch from "OAuth Client Credentials Flow" to "OIDC Implicit Code Flow"
    // const ACCESS_TOKEN = await fetch("https://id.twitch.tv/oauth2/token", {
    //     method: "POST",
    //     body: new URLSearchParams({
    //         client_id: CLIENT_ID,
    //         client_secret: CLIENT_SECRET,
    //         grant_type: "client_credentials",
    //     }),
    //     headers: {
    //         "Content-Type": "application/x-www-form-urlencoded",
    //     },
    // })
    //     .then((response) => response.json())
    //     .then((body) => body.access_token);
    // console.log(`ACCESS_TOKEN: ${ACCESS_TOKEN}`);

    const USER = await fetch(
        `https://api.twitch.tv/helix/users?login=${USERNAME}`,
        {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Client-ID": CLIENT_ID,
            },
        }
    )
        .then((response) => response.json())
        .then((body) => body.data[0]);

    console.log(USER);
    console.log(`user: ${USER.id}`);

    const PubSub = new WebSocket("wss://pubsub-edge.twitch.tv");

    const pingPongTimer = setInterval(() => {
        PubSub.send(JSON.stringify({ type: "PING" }));
    }, 30000);

    const listenNonce = Math.random().toString(36).slice(2, 10);
    PubSub.addEventListener("open", (event) => {
        console.log("CONNECTION OPEN");
        PubSub.send(
            JSON.stringify({
                type: "LISTEN",
                nonce: listenNonce,
                data: {
                    topics: TOPICS.map(value => value.replace('<USER_ID>', USER.id)),
                    auth_token: ACCESS_TOKEN,
                },
            })
        );
    });

    PubSub.addEventListener("error", (error) => {
        throw new Error(error);
    });

    PubSub.addEventListener("close", (event) => {
        console.log("Websocket Closed");
        clearInterval(pingPongTimer);
    });

    PubSub.addEventListener("message", (event) => {
        console.log("MESSAGE RECEIVED");
        const message = JSON.parse(event.data);
        console.log(message);

        if (message.type === "PONG") {
            return true;
        }

        if (message.type === "RECONNECT") {
            console.warn("Reconnecting Websocket");
            clearInterval(pingPongTimer);
            run();
            return;
        }

        if (message.type === "RESPONSE" && message.error !== "") {
            throw new Error(message.error);
        }

        if (message.type === "MESSAGE") {
            let event = new CustomEvent(message.data.topic, {
                detail: message.data.message,
            });
            return window.dispatchEvent(event);
        }
        console.warn("Unknown message type received");
    });
}
