export const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await globalThis.fetch(input, init);
  
  if (response.status === 401) {
    // On essaie de lire le corps pour voir si c'est une déconnexion forcée
    // On clone pour ne pas consommer le body pour l'appelant original
    try {
      const clone = response.clone();
      const body = await clone.json();
      
      if (body?.code === 'SESSION_REPLACED') {
        globalThis.dispatchEvent(new Event('auth:session_replaced'));
      } else {
        globalThis.dispatchEvent(new Event('auth:unauthorized'));
      }
    } catch (e) {
      // Fallback si pas de JSON (ex: erreur serveur générique)
      globalThis.dispatchEvent(new Event('auth:unauthorized'));
    }
  }
  
  return response;
};