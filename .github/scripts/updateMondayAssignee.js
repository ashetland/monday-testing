// @ts-check
const {
  updateMultipleColumns,
  notInLifecycle,
  assignPerson,
} = require("./support/utils");
const { mondayLabels, resources } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesAssignedEvent | import('@octokit/webhooks-types').IssuesUnassignedEvent } */ (
      context.payload
    );
  const {
    issue: { number, body, assignees: currentAssignees, labels },
    assignee: newAssignee,
    action,
  } = payload;

  if (!newAssignee) {
    throw new Error(`No new assignee found for issue #${number}.`);
  }

  /**
   * Assignes each of the current assignees to the value object.
   */
  function updateAssignees() {
    currentAssignees.forEach((assignee) => {
      valueObject = assignPerson(assignee, valueObject);
    });
  }

  let valueObject = {};
  // Unassigned action, no assignees left, not in lifecycle:
  // Set status to "Unassigned", no assignee updates
  if (
    action === "unassigned" &&
    currentAssignees.length === 0 &&
    notInLifecycle(labels)
  ) {
    const unassigned = mondayLabels.get(resources.labels.issueWorkflow.new);

    if (unassigned) {
      valueObject[unassigned.column] = unassigned.value;
    }

    console.info("Set status to unassigned, no assignees updated");
  }
  // Assigned action, not in lifecycle besides "needs milestone":
  // Set status to "Assigned", update assignees
  else if (
    action === "assigned" &&
    notInLifecycle(labels, { skipMilestone: true })
  ) {
    const assigned = mondayLabels.get(resources.labels.issueWorkflow.assigned);
    if (assigned) {
      valueObject[assigned.column] = assigned.value;
    }

    updateAssignees();

    console.info("Update assignees, set status to assigned");
  } else if (currentAssignees.length > 0) {
    updateAssignees();

    console.info("Update assignees, no status change");
  }

  if (!Object.keys(valueObject).length) {
    console.info("No updates to assignees or status.");
    return;
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
  } catch (error) {
    throw new Error(`Error updating assignee values in Monday.com: ${error}`);
  }
};
