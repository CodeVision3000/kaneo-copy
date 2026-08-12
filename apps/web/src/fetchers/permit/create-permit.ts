import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreatePermitRequest = InferRequestType<
  (typeof client)["permit"][":projectId"]["$post"]
>["json"] & { projectId: string };

async function createPermit({ projectId, ...permit }: CreatePermitRequest) {
  const response = await client.permit[":projectId"].$post({
    param: { projectId },
    json: permit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default createPermit;
