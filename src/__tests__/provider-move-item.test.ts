import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrelloProvider } from "../providers/trello/trello-provider.js";
import { LinearProvider } from "../providers/linear/linear-provider.js";
import { JiraProvider } from "../providers/jira/jira-provider.js";

const originalFetch = globalThis.fetch;

function mockFetch(responses: Array<{ ok: boolean; json?: () => Promise<unknown>; status?: number; statusText?: string }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[callIndex++];
    if (!response) throw new Error("Unexpected fetch call");
    return Promise.resolve({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      statusText: response.statusText ?? (response.ok ? "OK" : "Error"),
      json: response.json ?? (() => Promise.resolve({})),
    });
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("TrelloProvider.moveItem", () => {
  it("moves card to target list by name", async () => {
    const fetchMock = mockFetch([
      // GET /cards/{id} → returns card with idBoard
      { ok: true, json: () => Promise.resolve({ id: "card1", idBoard: "board1" }) },
      // GET /boards/{id}/lists → returns lists
      {
        ok: true,
        json: () => Promise.resolve([
          { id: "list1", name: "To Do" },
          { id: "list2", name: "In Progress" },
          { id: "list3", name: "Done" },
        ]),
      },
      // PUT /cards/{id} → move card
      { ok: true },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new TrelloProvider("key", "token");
    await provider.moveItem("card1", "in_progress");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    // Verify the PUT call includes the correct list ID
    const putCall = fetchMock.mock.calls[2];
    expect(putCall[0]).toContain("/cards/card1");
    expect(putCall[0]).toContain("idList=list2");
    expect(putCall[1].method).toBe("PUT");
  });

  it("throws when target list not found", async () => {
    const fetchMock = mockFetch([
      { ok: true, json: () => Promise.resolve({ id: "card1", idBoard: "board1" }) },
      {
        ok: true,
        json: () => Promise.resolve([
          { id: "list1", name: "Backlog" },
          { id: "list2", name: "Doing" },
        ]),
      },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new TrelloProvider("key", "token");
    await expect(provider.moveItem("card1", "in_progress")).rejects.toThrow(
      'Trello list "In Progress" not found on board',
    );
  });

  it("matches list name case-insensitively", async () => {
    const fetchMock = mockFetch([
      { ok: true, json: () => Promise.resolve({ id: "card1", idBoard: "board1" }) },
      {
        ok: true,
        json: () => Promise.resolve([
          { id: "list1", name: "in progress" },
        ]),
      },
      { ok: true },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new TrelloProvider("key", "token");
    await provider.moveItem("card1", "in_progress");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws on API error", async () => {
    const fetchMock = mockFetch([
      { ok: false, status: 404, statusText: "Not Found" },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new TrelloProvider("key", "token");
    await expect(provider.moveItem("card1", "done")).rejects.toThrow("Trello API error");
  });
});

describe("LinearProvider.moveItem", () => {
  it("updates issue state via GraphQL", async () => {
    const fetchMock = mockFetch([
      // Lookup issue by identifier
      {
        ok: true,
        json: () => Promise.resolve({
          data: { issues: { nodes: [{ id: "uuid-1", team: { id: "team-1" } }] } },
        }),
      },
      // Lookup workflow state
      {
        ok: true,
        json: () => Promise.resolve({
          data: { workflowStates: { nodes: [{ id: "state-1" }] } },
        }),
      },
      // Issue update mutation
      {
        ok: true,
        json: () => Promise.resolve({
          data: { issueUpdate: { success: true } },
        }),
      },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new LinearProvider("api-key");
    await provider.moveItem("LIN-42", "in_review");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    // Check the mutation call
    const mutationBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(mutationBody.query).toContain("issueUpdate");
    expect(mutationBody.query).toContain("state-1");
  });

  it("throws when issue not found", async () => {
    const fetchMock = mockFetch([
      {
        ok: true,
        json: () => Promise.resolve({
          data: { issues: { nodes: [] } },
        }),
      },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new LinearProvider("api-key");
    await expect(provider.moveItem("LIN-99", "done")).rejects.toThrow(
      "Linear issue not found: LIN-99",
    );
  });

  it("throws when workflow state not found", async () => {
    const fetchMock = mockFetch([
      {
        ok: true,
        json: () => Promise.resolve({
          data: { issues: { nodes: [{ id: "uuid-1", team: { id: "team-1" } }] } },
        }),
      },
      {
        ok: true,
        json: () => Promise.resolve({
          data: { workflowStates: { nodes: [] } },
        }),
      },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new LinearProvider("api-key");
    await expect(provider.moveItem("LIN-42", "in_review")).rejects.toThrow(
      'Linear workflow state "In Review" not found',
    );
  });
});

describe("JiraProvider.moveItem", () => {
  it("transitions issue to target status", async () => {
    const fetchMock = mockFetch([
      // GET transitions
      {
        ok: true,
        json: () => Promise.resolve({
          transitions: [
            { id: "11", name: "Start Progress", to: { name: "In Progress" } },
            { id: "21", name: "Review", to: { name: "In Review" } },
            { id: "31", name: "Complete", to: { name: "Done" } },
          ],
        }),
      },
      // POST transition
      { ok: true },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new JiraProvider("mycompany", "user@example.com", "token123");
    await provider.moveItem("PROJ-42", "in_review");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const postCall = fetchMock.mock.calls[1];
    expect(postCall[0]).toContain("/transitions");
    const body = JSON.parse(postCall[1].body);
    expect(body.transition.id).toBe("21");
  });

  it("throws when transition not available", async () => {
    const fetchMock = mockFetch([
      {
        ok: true,
        json: () => Promise.resolve({
          transitions: [
            { id: "11", name: "Start", to: { name: "In Progress" } },
          ],
        }),
      },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new JiraProvider("mycompany", "user@example.com", "token123");
    await expect(provider.moveItem("PROJ-42", "done")).rejects.toThrow(
      'Jira transition to "Done" not available for PROJ-42',
    );
  });

  it("matches transition name case-insensitively", async () => {
    const fetchMock = mockFetch([
      {
        ok: true,
        json: () => Promise.resolve({
          transitions: [
            { id: "31", name: "Finish", to: { name: "done" } },
          ],
        }),
      },
      { ok: true },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new JiraProvider("mycompany", "user@example.com", "token123");
    await provider.moveItem("PROJ-42", "done");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on API error getting transitions", async () => {
    const fetchMock = mockFetch([
      { ok: false, status: 403, statusText: "Forbidden" },
    ]);
    globalThis.fetch = fetchMock;

    const provider = new JiraProvider("mycompany", "user@example.com", "token123");
    await expect(provider.moveItem("PROJ-42", "in_progress")).rejects.toThrow(
      "Jira API error: 403 Forbidden",
    );
  });
});
