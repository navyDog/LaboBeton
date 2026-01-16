export const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await window.fetch(input, init);
  
  if (response.status === 401) {
    // On essaie de lire le corps pour voir si c'est une déconnexion forcée
    // On clone pour ne pas consommer le body pour l'appelant original
    try {
      const clone = response.clone();
      const body = await clone.json();
      
      if (body && body.code === 'SESSION_REPLACED') {
        window.dispatchEvent(new Event('auth:session_replaced'));
      } else {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } catch (e) {
      // Fallback si pas de JSON (ex: erreur serveur générique)
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }
  
  return response;
};