import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateCircuitRequest = InferRequestType<
  (typeof client)["circuit"][":projectId"][":id"]["$put"]
>["json"] & { projectId: string; id: string };

async function updateCircuit({
  projectId,
  id,
  ...circuit
}: UpdateCircuitRequest) {
  const response = await client.circuit[":projectId"][":id"].$put({
    param: { projectId, id },
    json: circuit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default updateCircuit;
