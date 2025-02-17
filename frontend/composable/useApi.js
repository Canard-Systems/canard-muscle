import { useCookie } from '#app';

export async function useApi(url, options = {}) {
    const tokenCookie = useCookie('token');
    const refreshCookie = useCookie('refresh');

    // Toujours inclure les credentials pour envoyer les cookies HTTP-only
    options.credentials = 'include';

    options.headers = options.headers || {};
    if (tokenCookie.value) {
        options.headers.Authorization = `Bearer ${tokenCookie.value}`;
    } else if (refreshCookie.value) {
        options.headers.Authorization = `Bearer ${refreshCookie.value}`;
    }

    try {
        // Tenter la requête initiale
        return await $fetch(url, options);
    } catch (err) {
        // Si le serveur répond 401, tenter de rafraîchir l'access token
        if (err.response && err.response.status === 401) {
            const refreshResponse = await $fetch('http://localhost:8000/api/token/refresh', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${refreshCookie.value}`,
                },
            });

            if (refreshResponse.token) {
                // Mettre à jour le cookie et les headers, puis retenter la requête
                tokenCookie.value = refreshResponse.token;
                options.headers.Authorization = `Bearer ${refreshResponse.token}`;
                return await $fetch(url, options);
            }
        }
        throw err;
    }
}
