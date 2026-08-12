import { client } from "@kaneo/libs";

async function getPermits(projectId: string) {
  const response = await client.permit[":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default getPermits;
