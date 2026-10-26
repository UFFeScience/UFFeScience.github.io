export function createApifyClient(token, fetchImpl = fetch) {
  return async function api(endpoint, { method = 'GET', body } = {}) {
    const response = await fetchImpl(`https://api.apify.com/v2/${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      const error = new Error(`Apify respondeu HTTP ${response.status} em ${method} ${endpoint}.`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };
}

export async function openPublicationStore(api, config) {
  // Named stores are retained and POST is get-or-create, including after deletion.
  const name = config.storeName || 'uffescience-publications';
  const result = await api(`key-value-stores?name=${encodeURIComponent(name)}`, { method: 'POST' });
  if (!result?.data?.id) throw new Error('Apify não retornou o ID do armazenamento nomeado.');
  return result.data.id;
}
