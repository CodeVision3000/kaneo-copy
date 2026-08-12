import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type ImportConstructionUnitsRequest = InferRequestType<
  (typeof client)["construction-unit"][":workspaceId"]["import"]["$post"]
>["json"]["units"];

async function importConstructionUnits(
  workspaceId: string,
  units: ImportConstructionUnitsRequest,
) {
  const response = await client["construction-unit"][
    ":workspaceId"
  ].import.$post({
    param: { workspaceId },
    json: { units },
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default importConstructionUnits;
