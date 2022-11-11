let SCOPES = [];
let USER;

export async function getUser()
{
    if (!USER) {
        USER = await fetch(
            `https://api.twitch.tv/helix/users?login=${process.env.MIX_USERNAME}`,
            {
                headers: {
                    Authorization: `Bearer ${getAppToken()}`,
                    "Client-ID": process.env.MIX_CLIENT_ID,
                },
            }
        )
            .then((response) => response.json())
            .then((body) => body.data[0]);

        console.groupCollapsed(`Fetched USER ${USER.login}`);
        console.log(USER);
        console.groupEnd();
    }
    return USER;
}

export function getUserToken()
{
    let match = document.location.hash.match(/access_token=(\w+)/);
    if (Array.isArray(match) && match.length > 1 && ) {
        localStorage.setItem('USER_ACCESS_TOKEN', match[1]);
    } else if (!localStorage.getItem('USER_ACCESS_TOKEN')) {
        window.location = getUserAuthUrl();
        return false;
    }
    console.log(`USER_ACCESS_TOKEN: ${localStorage.getItem('USER_ACCESS_TOKEN')}`);
    return localStorage.getItem('USER_ACCESS_TOKEN');
}

export function setScopes(scopes)
{
    return SCOPES = scopes;
}

function getUserAuthUrl()
{
    return 'https://id.twitch.tv/oauth2/authorize'
    + '?response_type=token'
    + `&client_id=${process.env.MIX_CLIENT_ID}`
    + '&redirect_uri=' + window.location.href
    + '&scope=' + SCOPES.join('+');
}

export async function getAppToken()
{
    if (!localStorage.getItem('APP_ACCESS_TOKEN')) {
        const app_token = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.MIX_CLIENT_ID,
                client_secret: process.env.MIX_CLIENT_SECRET,
                grant_type: "client_credentials",
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
        .then((response) => response.json())
        .then((body) => body.access_token);

        localStorage.setItem('APP_ACCESS_TOKEN', app_token);
    }
    return localStorage.getItem('APP_ACCESS_TOKEN');
}