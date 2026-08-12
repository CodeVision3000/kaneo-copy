import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type RecordProductionRequest = InferRequestType<
  (typeof client)["pay-item"][":projectId"]["production"]["$post"]
>["json"] & { projectId: string };

async function recordProduction({
  projectId,
  ...entry
}: RecordProductionRequest) {
  const response = await client["pay-item"][":projectId"].production.$post({
    param: { projectId },
    json: entry,
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default recordProduction;
