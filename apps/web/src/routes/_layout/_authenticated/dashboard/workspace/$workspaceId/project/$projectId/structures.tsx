import { createFileRoute } from "@tanstack/react-router";
import ProjectLayout from "@/components/common/project-layout";
import StructureRegister from "@/components/grid-asset/structure-register";
import PageTitle from "@/components/page-title";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/structures",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId, projectId } = Route.useParams();

  return (
    <>
      <PageTitle title="Structures" />
      <ProjectLayout
        workspaceId={workspaceId}
        projectId={projectId}
        activeView="structures"
      >
        <StructureRegister projectId={projectId} />
      </ProjectLayout>
    </>
  );
}
