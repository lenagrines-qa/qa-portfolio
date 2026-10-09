/**
 * TC-08 Posts API — create a post through a REST API, without a browser.
 *
 * JSONPlaceholder (https://jsonplaceholder.typicode.com) is a free public
 * REST API made for testing and practice. It answers like a real backend
 * (status codes, JSON, new ids) but does not really save anything.
 *
 * Runs only in the `api` project (see playwright.config.ts), whose baseURL
 * is https://jsonplaceholder.typicode.com. Needs internet access.
 */
import { test, expect } from '../fixtures/test';

test.describe('TC-08 Posts API', () => {
  // TC-08: POST /posts creates a post and returns it with a new id.
  // `request` is Playwright's built-in API client: plain HTTP, no page.
  test('POST /posts creates a post and returns it with a new id', async ({ request }) => {
    // Request body: the post we want to create.
    const newPost = { title: 'QA portfolio', body: 'Checked by Playwright', userId: 1 };

    // `data` with an object is sent as JSON (Content-Type: application/json).
    const response = await request.post('/posts', { data: newPost });

    // 201 Created, not just "some 2xx": the API confirms a new resource.
    expect(response.status()).toBe(201);

    // The server answers in JSON, so the client can parse the body.
    expect(response.headers()['content-type']).toContain('application/json');

    // The response returns every field we sent, unchanged...
    const created = await response.json();
    expect(created).toMatchObject(newPost);

    // ...plus the id the server gave the new post.
    expect(created.id).toEqual(expect.any(Number));
  });
});
