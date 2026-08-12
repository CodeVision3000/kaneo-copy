import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreatePayItemRequest = InferRequestType<
  (typeof client)["pay-item"][":projectId"]["$post"]
>["json"] & { projectId: string };

async function createPayItem({ projectId, ...payItem }: CreatePayItemRequest) {
  const response = await client["pay-item"][":projectId"].$post({
    param: { projectId },
    json: payItem,
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default createPayItem;
