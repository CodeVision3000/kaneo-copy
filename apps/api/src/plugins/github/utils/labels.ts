import type { Octokit } from "octokit";

const labelColors: Record<string, string> = {
  "priority:routine": "0EA5E9",
  "priority:expedited": "EAB308",
  "priority:urgent": "F97316",
  "priority:emergency": "EF4444",
  "status:scheduled": "6B7280",
  "status:ready": "0EA5E9",
  "status:in-progress": "3B82F6",
  "status:awaiting-clearance": "F97316",
  "status:awaiting-inspection": "8B5CF6",
  "status:complete": "10B981",
  "status:energized": "22C55E",
  "status:planned": "8B5CF6",
  "status:archived": "6B7280",
};

export function getLabelColor(labelName: string): string {
  return labelColors[labelName] || "6B7280";
}

export async function ensureLabelsExist(
  octokit: Octokit,
  owner: string,
  repo: string,
  labels: string[],
) {
  for (const labelName of labels) {
    try {
      await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: labelName,
      });
    } catch {
      try {
        const color = getLabelColor(labelName);
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: labelName,
          color,
        });
      } catch (createError) {
        console.error(`Failed to create label "${labelName}":`, createError);
      }
    }
  }
}

export async function addLabelsToIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[],
) {
  try {
    await ensureLabelsExist(octokit, owner, repo, labels);

    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels,
    });
  } catch (error) {
    console.error("Failed to add labels to issue:", error);
  }
}

export async function removeLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  labelName: string,
) {
  try {
    await octokit.rest.issues.removeLabel({
      owner,
      repo,
      issue_number: issueNumber,
      name: labelName,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      return;
    }

    console.error(`Failed to remove label "${labelName}" from issue:`, error);
    throw error;
  }
}
