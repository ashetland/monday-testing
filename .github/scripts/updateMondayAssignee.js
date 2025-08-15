// @ts-check
const {
  updateMultipleColumns,
  notInLifecycle,
  assignPerson,
  assignLabel,
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
   * @param {Object} valueObject - The value object to update.
   * @returns {Object} - The updated value object with assignees added to respective columns.
   */
  function updateAssignees(valueObject) {
    currentAssignees.forEach((assignee) => {
      valueObject = assignPerson(assignee, valueObject);
    });
    return valueObject;
  }

  let valueObject = {};
  // Unassigned action, no assignees left, not in lifecycle:
  // Set status to "Unassigned", no assignee updates
  if (
    action === "unassigned" &&
    currentAssignees.length === 0 &&
    notInLifecycle(labels)
  ) {
    valueObject = assignLabel(resources.labels.issueWorkflow.new, valueObject);

    console.info("Set status to unassigned, no assignees updated");
  }
  // Assigned action, not in lifecycle besides "needs milestone":
  // Set status to "Assigned", update assignees
  else if (
    action === "assigned" &&
    notInLifecycle(labels, { skipMilestone: true })
  ) {
    valueObject = assignLabel(
      resources.labels.issueWorkflow.assigned,
      valueObject,
    );

    valueObject = updateAssignees(valueObject);

    console.info("Update assignees, set status to assigned");
  } else if (currentAssignees.length > 0) {
    valueObject = updateAssignees(valueObject);

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
