// @ts-check
const {
  updateMultipleColumns,
  notInLifecycle,
  assignLabel,
  updateAssignees,
} = require("./support/utils");
const {
  resources: {
    labels: {
      issueWorkflow: { new: newLabel, assigned: assignedLabel },
    },
  },
} = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const {
    issue: { number, body, assignees: currentAssignees, labels },
    assignee: newAssignee,
    action,
  } = /** @type {import('@octokit/webhooks-types').IssuesAssignedEvent | import('@octokit/webhooks-types').IssuesUnassignedEvent } */ (
    context.payload
  );

  if (!newAssignee) {
    console.log(`No new assignee found for issue #${number}.`);
    process.exit(0);
  }

  let valueObject = {};
  // Unassigned action, no assignees left, not in lifecycle:
  // Set status to "Unassigned", no assignee updates
  if (
    action === "unassigned" &&
    currentAssignees.length === 0 &&
    notInLifecycle(labels)
  ) {
    valueObject = assignLabel(newLabel, valueObject);

    console.info("Set status to unassigned, no assignees updated");
  }
  // Assigned action, not in lifecycle besides "needs milestone":
  // Set status to "Assigned", update assignees
  else if (
    action === "assigned" &&
    notInLifecycle(labels, { skipMilestone: true })
  ) {
    valueObject = assignLabel(assignedLabel, valueObject);
    valueObject = updateAssignees(currentAssignees, valueObject);

    console.info("Update assignees, set status to assigned");
  } else if (currentAssignees.length > 0) {
    valueObject = updateAssignees(currentAssignees, valueObject);

    console.info("Update assignees, no status change");
  }

  if (!Object.keys(valueObject).length) {
    console.info("No updates to assignees or status.");
    process.exit(0);
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
    process.exit(0);
  } catch (error) {
    console.log(`Error updating assignee values in Monday.com: ${error}`);
    process.exit(1);
  }
};
