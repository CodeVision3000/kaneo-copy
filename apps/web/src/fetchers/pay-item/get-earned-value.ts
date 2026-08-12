import { client } from "@kaneo/libs";

async function getEarnedValue(projectId: string) {
  const response = await client["pay-item"][":projectId"]["earned-value"].$get({
    param: { projectId },
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}

export default getEarnedValue;
