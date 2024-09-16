import decamelizeKeys from 'decamelize-keys';

export interface WorkWiseRequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown>
}

export const workwiseFetch = async (endpoint: string, accessToken: string, options: WorkWiseRequestOptions = {}) => {
  const headers = {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json",
    ...options.headers
  };

  const opts: RequestInit = {
    headers,
    method: options.method || 'GET',
    ...(options.body && { body: JSON.stringify(decamelizeKeys(options.body, { deep: true })) })
  };

  try {
    const response = await fetch(`${process.env.WORKWISE_URL}/${endpoint}`, opts);

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error fetching:', error);
    throw error;
  }
};
