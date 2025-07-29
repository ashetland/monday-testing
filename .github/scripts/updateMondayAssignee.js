// @ts-check
const { updateMultipleColumns, notReadyForDev, notInLifecycle } = require("./support/utils");
const { mondayPeople, mondayLabels, resources } = require("./support/resources");

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

  /**
    * @param {import('@octokit/webhooks-types').User} assignee
    * @param {import('@octokit/webhooks-types').User[]} currentAssignees
    * @param {object} values - Object to hold the values to be updated in Monday
  */
  function getAssigneeValue(assignee, currentAssignees, values) {
    const personInfo = mondayPeople.get(assignee.login);
    if (!personInfo) {
      console.log(
        `No Monday person info found for assignee ${assignee.login}. Skipping update.`,
      );
      return;
    }

    currentAssignees.forEach((assignee) => {
      if (assignee.login === assignee.login) {
        return;
      }

      const info = mondayPeople.get(assignee.login);
      if (info && info.role === personInfo.role) {
        if (values[info.role]) {
          values[info.role] += `, `;
        }

        values[info.role] += `${info.id}`;
      }
    });

    if (values[personInfo.role]) {
      values[personInfo.role] += `, ${personInfo.id}`;
    } else {
      values[personInfo.role] = `${personInfo.id}`;
    }

    return values;
  }

  if (!newAssignee) {
    throw new Error(`No new assignee found for issue #${number}.`);
  }

  let valueObject = {};
  if (action === "unassigned" && notReadyForDev(labels)) {
    const unassigned = mondayLabels.get(resources.labels.issueWorkflow.new);

    if (unassigned) {
      valueObject[unassigned.column] = unassigned.value;
    }
  } else {
    if (notInLifecycle(labels)) {
      const assigned = mondayLabels.get(resources.labels.issueWorkflow.assigned);

      if (assigned) {
        valueObject[assigned.column] = assigned.value;
      }
    }

    valueObject = getAssigneeValue(newAssignee, currentAssignees, valueObject);
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
  } catch (error) {
    throw new Error(`Error updating assignee values in Monday.com: ${error}`);
  }
};
