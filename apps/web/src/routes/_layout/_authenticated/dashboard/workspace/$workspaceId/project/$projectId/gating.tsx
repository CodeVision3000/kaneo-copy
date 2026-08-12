import { createFileRoute } from "@tanstack/react-router";
import ProjectLayout from "@/components/common/project-layout";
import GatingBoard from "@/components/gating/gating-board";
import PageTitle from "@/components/page-title";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/gating",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId, projectId } = Route.useParams();

  return (
    <>
      <PageTitle title="Outages & permits" />
      <ProjectLayout
        workspaceId={workspaceId}
        projectId={projectId}
        activeView="gating"
      >
        <GatingBoard projectId={projectId} />
      </ProjectLayout>
    </>
  );
}
