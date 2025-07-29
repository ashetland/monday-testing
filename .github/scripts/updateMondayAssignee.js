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
  function addAssignee(assignee, currentAssignees, values) {
    const assigneeInfo = mondayPeople.get(assignee.login);
    if (!assigneeInfo) {
      console.log(
        `No Monday person info found for assignee ${assignee.login}. Skipping update.`,
      );
      return;
    }

    currentAssignees.forEach((person) => {
      if (person.login === assignee.login) {
        return;
      }

      const currentPerson = mondayPeople.get(person.login);
      if (currentPerson && currentPerson.role === assigneeInfo.role) {
        if (values[currentPerson.role]) {
          values[currentPerson.role] += `, ${currentPerson.id}`;
        } else {
          values[currentPerson.role] = `${currentPerson.id}`;
        }
      }
    });

    if (values[assigneeInfo.role]) {
      values[assigneeInfo.role] += `, ${assigneeInfo.id}`;
    } else {
      values[assigneeInfo.role] = `${assigneeInfo.id}`;
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

    valueObject = addAssignee(newAssignee, currentAssignees, valueObject);
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
  } catch (error) {
    throw new Error(`Error updating assignee values in Monday.com: ${error}`);
  }
};
