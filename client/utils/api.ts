export const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await globalThis.fetch(input, init);

  if (response.status === 401) {
    // Déclenche un événement global que App.tsx écoutera
    globalThis.dispatchEvent(new Event('auth:unauthorized'));
  }

  return response;
};