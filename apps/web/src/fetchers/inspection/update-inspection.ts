import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateInspectionRequest = InferRequestType<
  (typeof client)["inspection"][":projectId"][":id"]["$put"]
>["json"] & { projectId: string; id: string };

async function updateInspection({
  projectId,
  id,
  ...inspection
}: UpdateInspectionRequest) {
  const response = await client.inspection[":projectId"][":id"].$put({
    param: { projectId, id },
    json: inspection,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default updateInspection;
