/**
 * TC-08 Posts API — create, read, update, and delete a post through a REST API,
 * plus one negative case, all without a browser.
 *
 * JSONPlaceholder (https://jsonplaceholder.typicode.com) is a free public
 * REST API made for testing and practice. It answers like a real backend
 * (status codes, JSON, new ids) but does not really save anything,
 * so every test is independent and can run in any order.
 *
 * Runs only in the `api` project (see playwright.config.ts), whose baseURL
 * is https://jsonplaceholder.typicode.com. Needs internet access.
 *
 * `request` is Playwright's built-in API client: plain HTTP, no page.
 */
import { test, expect } from '../fixtures/test';

test.describe('TC-08 Posts API', () => {
  // TC-08: POST /posts creates a post and returns it with a new id.
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

  // TC-08b: GET /posts/1 returns that exact post with all its fields.
  test('GET /posts/1 returns the post with id 1', async ({ request }) => {
    const response = await request.get('/posts/1');

    // 200 OK: the post exists.
    expect(response.status()).toBe(200);

    // The body is the post we asked for (id 1), and every field has the
    // right type. Checking types, not exact texts, keeps the test about
    // the API contract instead of the demo data.
    const post = await response.json();
    expect(post).toEqual({
      id: 1,
      userId: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
    });
  });

  // TC-08c: PUT /posts/1 replaces the post and returns the new version.
  test('PUT /posts/1 updates the post and returns the new data', async ({ request }) => {
    // PUT sends the whole new version of the post, not just changed fields.
    const updatedPost = { id: 1, title: 'Updated title', body: 'Updated by Playwright', userId: 1 };

    const response = await request.put('/posts/1', { data: updatedPost });

    // 200 OK (not 201): an existing post was changed, nothing new was created.
    expect(response.status()).toBe(200);

    // The response is exactly the version we sent.
    expect(await response.json()).toEqual(updatedPost);
  });

  // TC-08d: DELETE /posts/1 is accepted and returns an empty body.
  test('DELETE /posts/1 deletes the post', async ({ request }) => {
    const response = await request.delete('/posts/1');

    // 200 OK: the server accepted the delete.
    expect(response.status()).toBe(200);

    // Nothing is left to return, so the body is an empty JSON object.
    expect(await response.json()).toEqual({});
  });

  // TC-08e (negative): a post that does not exist returns 404, not an empty 200.
  test('GET /posts/999999 returns 404 for a post that does not exist', async ({ request }) => {
    const response = await request.get('/posts/999999');

    // 404 Not Found: the API tells the client the post is missing,
    // so the app can show "not found" instead of an empty page.
    expect(response.status()).toBe(404);
  });
});
