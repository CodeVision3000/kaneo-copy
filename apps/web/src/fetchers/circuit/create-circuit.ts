import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreateCircuitRequest = InferRequestType<
  (typeof client)["circuit"][":projectId"]["$post"]
>["json"] & { projectId: string };

async function createCircuit({ projectId, ...circuit }: CreateCircuitRequest) {
  const response = await client.circuit[":projectId"].$post({
    param: { projectId },
    json: circuit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default createCircuit;
