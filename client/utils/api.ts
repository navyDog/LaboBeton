export const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await window.fetch(input, init);

  if (response.status === 401) {
    // Déclenche un événement global que App.tsx écoutera
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  return response;
};