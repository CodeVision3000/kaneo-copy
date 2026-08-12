import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreateOutageRequest = InferRequestType<
  (typeof client)["outage"][":projectId"]["$post"]
>["json"] & { projectId: string };

async function createOutage({ projectId, ...outage }: CreateOutageRequest) {
  const response = await client.outage[":projectId"].$post({
    param: { projectId },
    json: outage,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default createOutage;
