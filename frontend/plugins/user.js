export default defineNuxtPlugin(async () => {
    const token = useCookie('token').value;
    const user = useState('user', () => null); // Initialisation avec `null`

    if (token && !user.value) {
        try {
            // Charger les informations utilisateur via l'API
            user.value = await $fetch('http://localhost:8000/api/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error('Erreur lors de la récupération des informations utilisateur :', err);
            user.value = null;
        }
    }
});
