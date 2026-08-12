import { client } from "@kaneo/libs";

async function getConstructionUnits(workspaceId: string) {
  const response = await client["construction-unit"][":workspaceId"].$get({
    param: { workspaceId },
    query: {},
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default getConstructionUnits;
