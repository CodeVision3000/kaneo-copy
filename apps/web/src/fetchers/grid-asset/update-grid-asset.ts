import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateGridAssetRequest = InferRequestType<
  (typeof client)["grid-asset"][":projectId"][":id"]["$put"]
>["json"] & { projectId: string; id: string };

async function updateGridAsset({
  projectId,
  id,
  ...asset
}: UpdateGridAssetRequest) {
  const response = await client["grid-asset"][":projectId"][":id"].$put({
    param: { projectId, id },
    json: asset,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default updateGridAsset;
