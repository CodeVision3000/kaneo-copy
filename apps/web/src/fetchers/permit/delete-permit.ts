import { client } from "@kaneo/libs";

async function deletePermit(projectId: string, id: string) {
  const response = await client.permit[":projectId"][":id"].$delete({
    param: { projectId, id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default deletePermit;
