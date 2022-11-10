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
    window.location = authUrl();
}
run();

function authUrl() {
    return 'https://id.twitch.tv/oauth2/authorize'
        + '?response_type=token'
        + `&client_id=${CLIENT_ID}`
        + '&redirect_uri=' + window.location.href
        + '&scope=' + SCOPES.join('+');
}

async function run() {
    const USER = await fetch(
        `https://api.twitch.tv/helix/users?login=${USERNAME}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
                "Client-ID": CLIENT_ID,
            },
        }
    )
        .then((response) => {
            if (response.status === 401) {
                window.location = authUrl();
            }
            return response;
        })
        .then((response) => response.json())
        .then((body) => body.data[0]);

    console.groupCollapsed(`USER ${USER.login}`);
    console.log(USER);
    console.groupEnd();

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
                    auth_token: localStorage.getItem('ACCESS_TOKEN'),
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
        const message = JSON.parse(event.data);
        console.groupCollapsed(`MESSAGE RECEIVED: ${message.type}`);
        console.log(message);

        if (message.type === "PONG") {
            console.groupEnd();
            return true;
        }

        if (message.type === "RECONNECT") {
            console.warn("Reconnecting Websocket");
            PubSub.close();
            clearInterval(pingPongTimer);
            console.groupEnd();
            run();
            return false;
        }

        if (message.error !== "" && message.error !== undefined) {
            console.groupEnd();
            throw new Error(message.error);
        }

        if (message.type === 'RESPONSE' && message.nonce === listenNonce) {
            console.log('LISTENING TO:\n' + TOPICS.join('\n'));
            console.groupEnd();

            return true;
        }

        if (message.type === "MESSAGE") {
            let event = new CustomEvent(message.data.topic, {
                detail: JSON.parse(message.data.message),
            });

            console.groupCollapsed(`Dispatching event: ${message.data.topic}`);
            console.log(event);
            console.groupEnd();
            console.groupEnd();
            return window.dispatchEvent(event);
        }

        console.warn(`Unhandled message type received: ${message.type}`);
        console.groupEnd();
    });
}
