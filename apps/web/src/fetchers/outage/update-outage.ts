import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateOutageRequest = InferRequestType<
  (typeof client)["outage"][":projectId"][":id"]["$put"]
>["json"] & { projectId: string; id: string };

async function updateOutage({ projectId, id, ...outage }: UpdateOutageRequest) {
  const response = await client.outage[":projectId"][":id"].$put({
    param: { projectId, id },
    json: outage,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default updateOutage;
