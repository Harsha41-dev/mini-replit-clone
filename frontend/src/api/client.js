export const apiRoot = '/api/v1';

export async function apiRequest(path, options = {}) {
    const response = await fetch(apiRoot + path, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    const body = await response.json().catch(() => ({
        success: false,
        message: 'Server gave a bad response'
    }));

    if (!response.ok || body.success === false) {
        throw new Error(body.message || 'Request failed');
    }

    return body.data;
}
