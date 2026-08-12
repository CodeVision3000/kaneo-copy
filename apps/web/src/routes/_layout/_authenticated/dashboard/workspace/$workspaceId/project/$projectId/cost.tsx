import { createFileRoute } from "@tanstack/react-router";
import ProjectLayout from "@/components/common/project-layout";
import CostBoard from "@/components/cost/cost-board";
import PageTitle from "@/components/page-title";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/cost",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId, projectId } = Route.useParams();

  return (
    <>
      <PageTitle title="Cost & production" />
      <ProjectLayout
        workspaceId={workspaceId}
        projectId={projectId}
        activeView="cost"
      >
        <CostBoard projectId={projectId} workspaceId={workspaceId} />
      </ProjectLayout>
    </>
  );
}
