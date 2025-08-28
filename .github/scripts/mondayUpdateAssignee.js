// @ts-check
const { notInLifecycle } = require("./support/utils");
const Monday = require("./support/monday.js");
const {
  resources: {
    labels: {
      issueWorkflow: { new: newLabel, assigned: assignedLabel },
    },
  },
} = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const {
    issue,
    assignee: newAssignee,
    action,
  } = /** @type {import('@octokit/webhooks-types').IssuesAssignedEvent | import('@octokit/webhooks-types').IssuesUnassignedEvent } */ (
      context.payload
    );
  const { assignees: currentAssignees, labels } = issue;
  const monday = Monday(issue);

  if (!newAssignee) {
    console.log(`No new assignee found, exiting.`);
    process.exit(0);
  }

  // Unassigned action, no assignees left, not in lifecycle:
  // Set status to "Unassigned", no assignee updates
  if (
    action === "unassigned" &&
    currentAssignees.length === 0 &&
    notInLifecycle(labels)
  ) {
    monday.addLabel(newLabel);
    console.info("Set status to unassigned, no assignees updated.");
  }
  // Assigned action, not in lifecycle besides "needs milestone":
  // Set status to "Assigned", update assignees
  else if (
    action === "assigned" &&
    notInLifecycle(labels, { skipMilestone: true })
  ) {
    monday.addLabel(assignedLabel);
    monday.addAllAssignees();
    console.info("Update assignees, set status to assigned.");
  } else if (currentAssignees.length > 0) {
    monday.addAllAssignees();
    console.info("Update assignees, no status change.");
  }

  await monday.commitChanges();
};
