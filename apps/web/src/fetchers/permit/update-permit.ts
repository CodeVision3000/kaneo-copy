import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdatePermitRequest = InferRequestType<
  (typeof client)["permit"][":projectId"][":id"]["$put"]
>["json"] & { projectId: string; id: string };

async function updatePermit({ projectId, id, ...permit }: UpdatePermitRequest) {
  const response = await client.permit[":projectId"][":id"].$put({
    param: { projectId, id },
    json: permit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default updatePermit;
