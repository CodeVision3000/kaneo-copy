import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type ImportGridAssetsRequest = InferRequestType<
  (typeof client)["grid-asset"][":projectId"]["import"]["$post"]
>["json"]["assets"];

async function importGridAssets(
  projectId: string,
  assets: ImportGridAssetsRequest,
) {
  const response = await client["grid-asset"][":projectId"].import.$post({
    param: { projectId },
    json: { assets },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default importGridAssets;
