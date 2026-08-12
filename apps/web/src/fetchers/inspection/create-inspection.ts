import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreateInspectionRequest = InferRequestType<
  (typeof client)["inspection"][":projectId"]["$post"]
>["json"] & { projectId: string };

async function createInspection({
  projectId,
  ...inspection
}: CreateInspectionRequest) {
  const response = await client.inspection[":projectId"].$post({
    param: { projectId },
    json: inspection,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default createInspection;
