import { client } from "@kaneo/libs";

async function getPayItems(projectId: string) {
  const response = await client["pay-item"][":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default getPayItems;
