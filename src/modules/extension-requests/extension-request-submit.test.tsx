import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";

import type { ExtensionRequestDetail } from "@/types";
import { apiClient } from "@/services/api-client";
import { extensionRequestService } from "@/services/extension-request-service";
import { ExtensionRequestSubmit } from "./extension-request-submit";

const draft = {
  id: "existing-request",
  status: "DRAFT",
  requestedByUser: { id: "owner" },
  actionPlan: { responsibleUser: { id: "owner" } },
} as ExtensionRequestDetail;
const render = (
  request = draft,
  currentUserId = "owner",
  canRequest = true,
  isAdmin = false,
) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <ExtensionRequestSubmit
        request={request}
        currentUserId={currentUserId}
        canRequest={canRequest}
        isAdmin={isAdmin}
      />
    </QueryClientProvider>,
  );

test("shared submission control offers sending own saved draft and returned request", () => {
  assert.match(render(), /Enviar a revisión/);
  assert.match(render(), /misma solicitud/);
  assert.match(
    render({ ...draft, status: "MANAGER_REJECTED" }),
    /Enviar a revisión/,
  );
  assert.equal(render(draft, "owner", false), "");
  assert.equal(render(draft, "other"), "");
  assert.equal(render({ ...draft, status: "SENT_TO_MANAGER" }), "");
  assert.equal(
    render({
      ...draft,
      actionPlan: {
        ...draft.actionPlan!,
        responsibleUser: { id: "other" } as never,
      },
    }),
    "",
  );
  assert.match(render(draft, "admin", true, true), /Enviar a revisión/);
});

test("sending and retrying an existing draft uses the same submit endpoint, without creating", async () => {
  const paths: string[] = [];
  mock.method(apiClient, "post", async (path: string) => {
    paths.push(path);
    if (paths.length === 1) throw new Error("Send failed");
    return { data: { data: { ...draft, status: "SENT_TO_MANAGER" } } };
  });
  try {
    await assert.rejects(
      extensionRequestService.sendToManager(draft.id),
      /Send failed/,
    );
    const sent = await extensionRequestService.sendToManager(draft.id);
    assert.equal(sent.id, draft.id);
    assert.equal(sent.status, "SENT_TO_MANAGER");
    assert.deepEqual(
      paths,
      Array(2).fill(`/extension-requests/${draft.id}/submit`),
    );
  } finally {
    mock.restoreAll();
  }
});
