import { getAppToken, getUser } from "./auth"

async function run()
{
    const USER = await getUser();

    localStorage.setItem('total_followers', (await getFollowers()).total);

    setInterval(async function() {
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
    const user = await getUser();
    const token = await getAppToken();
    return await fetch(`${process.env.MIX_API_URI}/users/follows?to_id=${user.id}&first=100`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Client-ID": process.env.MIX_CLIENT_ID,
            },
        }
    ).then(response => response.json());
}
run();