export async function safeFetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      console.warn(`Fetch error for ${url}: ${res.status} ${text.slice(0, 100)}`);
      return null;
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    console.warn(`Expected JSON but got ${contentType} from ${url}. Payload starts with: ${text.slice(0, 50)}`);
    return null;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    return null;
  }
}
