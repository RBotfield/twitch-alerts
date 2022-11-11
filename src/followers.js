import { getAppToken, getUser } from "./auth"

async function run()
{
    const USER = await getUser();

    localStorage.setItem('total_followers', (await getFollowers()).total);

    setInterval(() => {
        const followers = await getFollowers();
        if (localStorage.getItem('total_followers') < followers.total) {
            const newFollowers = followers.total - localStorage.getItem('total_followers');
            for (let i = newFollowers-1; i >= 0; i--) {
                window.dispatchEvent(new CustomEvent('new_follower',{detail: followers.data[i]}));
            }
            localStorage.setItem('total_followers', followers.total)
        }
    }, 2000)
}

async function getFollowers()
{
    return await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${USER.id}&first=100`,
        {
            headers: {
                Authorization: `Bearer ${getAppToken()}`,
                "Client-ID": process.env.MIX_CLIENT_ID,
            },
        }
    ).then(response => response.json());
}
run();