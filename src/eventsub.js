import { getUserToken, getUser } from "./auth";

async function run(eventsubUrl) {
    const USER = await getUser();
    const ACCESS_TOKEN = await getUserToken();

    const EventSub = new WebSocket(eventsubUrl || process.env.MIX_EVENTSUB_URI);

    EventSub.addEventListener("open", (event) => {
        console.log("CONNECTION OPEN");

        const nonce = Math.random().toString(36).slice(2, 10);
    });

    EventSub.addEventListener("error", (error) => {
        throw new Error(error);
    });

    EventSub.addEventListener("close", (event) => {
        console.log("Websocket Closed");
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
                fetch(`${process.env.MIX_API_URI}/eventsub/subscriptions`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`,
                        "Client-ID": process.env.MIX_CLIENT_ID,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: "channel.raid",
                        // type: "channel.channel_points_custom_reward_redemption.add",
                        version: "1",
                        condition: {
                            to_broadcaster_user_id: USER.id,
                            // broadcaster_user_id: USER.id,
                        },
                        transport: {
                            method: "websocket",
                            session_id: localStorage.getItem('eventsub_session_id'),
                        },
                    }),
                })
                break;
            case 'session_keepalive':
                break;
            case 'session_reconnect':
                run(message.payload.session.reconnect_url);
                break;
            case 'notification':
                const event = new CustomEvent(message.metadata.subscription_type, {
                    detail: message.payload,
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
    EventSub.addEventListener('ping', (event) => {
        console.log('PINGED');
    });
}

run();
