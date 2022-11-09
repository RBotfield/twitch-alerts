import TwitchJs from 'twitch-js';
import Alpine from 'alpinejs';

const USERNAME = process.env.MIX_USERNAME;
const ACCESS_TOKEN = process.env.MIX_ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.MIX_REFRESH_TOKEN;
const CLIENT_ID = process.env.MIX_CLIENT_ID;

async function run () {
    const USER = await fetch(`https://api.twitch.tv/helix/users?login=${USERNAME}`, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Client-ID': CLIENT_ID
        }
    }).then(response => response.json())
    .then(body => body.data);

    const PubSub = new WebSocket('wss://pubsub-edge.twitch.tv');

    const pingPongTimer = setInterval(() => {
        PubSub.send(JSON.stringify({'type': 'PING'}));
    }, 30000);

    const listenNonce = Math.random().toString(36).slice(2, 10);
    PubSub.addEventListener('open', (event) => {
        console.log('CONNECTION OPEN');
        PubSub.send(JSON.stringify({
            'type': 'LISTEN',
            'nonce': listenNonce,
            'data' : {
                'topics': [
                    `channel-bits-events-v2.${USER.id}`,
                    `channel-points-channel-v1.${USER.id}`,
                    `channel-subscribe-events-v1.${USER.id}`,
                ],
                'auth_token': ACCESS_TOKEN,
            },
        }));
    });

    PubSub.addEventListener('message', (event) => {
        console.log('MESSAGE RECEIVED');
        const message = JSON.parse(event.data);
        console.log(message);

        if (message.type === 'PONG') {
            return true;
        }
        if (message.type === 'RESPONSE' && message.error !== "") {
            throw new Error(message.error)
        }

        if (message.type === "MESSAGE") {
            switch (message.data.topic) {
                case `channel-bits-events-v2.${USER.id}`:
                    break;
                case `channel-points-channel-v1.${USER.id}`:
                    break;
                case `channel-subscribe-events-v1.${USER.id}`:
                    Alpine.
                    break;
                default:
                    break;
            }
        }

    });
}
run();

