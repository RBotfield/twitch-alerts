import { getUserToken, setScopes, getUser } from "./auth";

const TOPICS = [
    'channel-bits-events-v2.<USER_ID>',
    'channel-points-channel-v1.<USER_ID>',
    'channel-subscribe-events-v1.<USER_ID>',
];

setScopes([
    'bits:read',
    'channel:read:redemptions',
    'channel:read:subscriptions',
]);

async function run() {
    const USER = await getUser();

    const PubSub = new WebSocket("wss://pubsub-edge.twitch.tv");

    const pingPongTimer = setInterval(() => {
        PubSub.send(JSON.stringify({ type: "PING" }));
    }, 30000);

    PubSub.addEventListener("open", (event) => {
        console.log("CONNECTION OPEN");

        const nonce = Math.random().toString(36).slice(2, 10);

        PubSub.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'RESPONSE' && message.nonce === nonce) {
                console.log('LISTENING TO:\n' + TOPICS.join('\n'));
                return true;
            }
        });

        PubSub.send(
            JSON.stringify({
                type: "LISTEN",
                nonce: nonce,
                data: {
                    topics: TOPICS.map(value => value.replace('<USER_ID>', USER.id)),
                    auth_token: getUserToken(),
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

        if (message.error !== "" && message.error !== undefined) {
            console.groupEnd();
            throw new Error(message.error);
        }

        switch (message.type) {
            case 'PONG':
                break;
            case 'RECONNECT':
                PubSub.close();
                clearInterval(pingPongTimer);
                console.groupEnd();
                run();
                return;
            case 'MESSAGE':
                const event = new CustomEvent(message.data.topic, {
                    detail: JSON.parse(message.data.message),
                });
                window.dispatchEvent(event);

                console.groupCollapsed(`Dispatched event: ${message.data.topic}`);
                    console.log(event);
                console.groupEnd();

                break;
        }

        console.groupEnd();
        return;
    });
}

run();
