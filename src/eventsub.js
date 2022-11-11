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
    const ACCESS_TOKEN = getUserToken();

    const EventSub = new WebSocket("wss://eventsub-beta.wss.twitch.tv/ws").;

    const pingPongTimer = setInterval(() => {
        EventSub.send(JSON.stringify({ type: "PING" }));
    }, 30000);

    EventSub.addEventListener("open", (event) => {
        console.log("CONNECTION OPEN");

        const nonce = Math.random().toString(36).slice(2, 10);
    });

    EventSub.addEventListener("error", (error) => {
        throw new Error(error);
    });

    EventSub.addEventListener("close", (event) => {
        console.log("Websocket Closed");
        clearInterval(pingPongTimer);
    });

    EventSub.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);

        console.groupCollapsed(`MESSAGE RECEIVED: ${message.metadata.message_type}`);
        console.log(message);

        if (message.error !== "" && message.error !== undefined) {
            console.groupEnd();
            throw new Error(message.error);
        }

        switch (message.metadata.message_type) {
            case 'session_welcome':
                localStorage.setItem('eventsub_session_id', message.payload.session.id)
                fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`,
                        "Client-ID": process.env.MIX_CLIENT_ID,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        type: "channel.follow",
                        version: "1",
                        condition: {
                            broadcaster_user_id: USER.id,
                        },
                        transport: {
                            method: "websocket",
                            session_id: localStorage.getItem('eventsub_session_id'),
                        },
                    }
                })
                break;
            case 'session_reconnect':
                EventSub.close();
                clearInterval(pingPongTimer);
                console.groupEnd();
                run();
                return;
            case 'notification':
                const event = new CustomEvent(message.metadata.subscription_type, {
                    detail: JSON.parse(message.payload),
                });
                window.dispatchEvent(event);

                console.groupCollapsed(`Dispatched event: ${message.metadata.subscription_type}`);
                    console.log(event);
                console.groupEnd();

                break;
        }

        console.groupEnd();
        return;
    });
}

run();
