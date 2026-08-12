import { client } from "@kaneo/libs";

/** Pass taskId to fetch just one task's hold points. */
async function getInspections(projectId: string, taskId?: string) {
  const response = await client.inspection[":projectId"].$get({
    param: { projectId },
    query: taskId ? { taskId } : {},
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default getInspections;
