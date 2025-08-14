// @ts-check
const { updateMultipleColumns, notInLifecycle, assignPerson } = require("./support/utils");
const {
  mondayPeople,
  mondayLabels,
  resources,
  mondayColumns,
} = require("./support/resources");

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
   * Add an assignee to a values object. If another person of the same role
   * is already assiged, it will append the new assignee to the existing list.
   * If not, it will overwrite the value for that role.
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

  // Update status based on label state
  // 1. No "if" statement: If unassigning event and assignees not empty, don't do anything
  // 2. If unassigning and no more assignees and notInLifecycle - set to "Unassigned"
  // 3. If unassigning a PE, and other PEs are assigned, "remove" the PE from the list by assigning other assigned PEs
  // 4. If assigning and no status labels besides "needs milestone", set status to "Assigned" and add assignee
  // 5. If assigning and has status labels, only add assignee
  let valueObject = {};

  for (const person of currentAssignees) {
    if (person.login === newAssignee.login) {
      return;
    }

    valueObject = assignPerson(person, valueObject);
  }

  // if (
  //   action === "unassigned" &&
  //   currentAssignees.length === 0 &&
  //   notInLifecycle(labels)
  // ) {
  //   const unassigned = mondayLabels.get(resources.labels.issueWorkflow.new);
  //
  //   if (unassigned) {
  //     valueObject[unassigned.column] = unassigned.value;
  //   }
  // } else if (
  //   action === "unassigned" &&
  //   currentAssignees.length !== 0 &&
  //   currentAssignees.some(
  //     (assignee) => mondayPeople.get(assignee.login)?.role === mondayColumns.productEngineers,
  //   )
  // ) {
  //   const productEngineers = currentAssignees
  //     .filter((assignee) => mondayPeople.get(assignee.login)?.role === mondayColumns.productEngineers);
  //
  //   for (const person of productEngineers) {
  //     valueObject = assignPerson(person, valueObject);
  //   }
  // }
  //   else if (
  //   action === "assigned" &&
  //   notInLifecycle(labels, { skipMilestone: true })
  // ) {
  //   const assigned = mondayLabels.get(resources.labels.issueWorkflow.assigned);
  //
  //   if (assigned) {
  //     valueObject[assigned.column] = assigned.value;
  //   }
  //
  //   valueObject = addAssignee(newAssignee, currentAssignees, valueObject);
  // } else if (action === "assigned" && !notInLifecycle(labels)) {
  //   valueObject = addAssignee(newAssignee, currentAssignees, valueObject);
  // }

  if (!Object.keys(valueObject).length) {
    console.warn(`No value object created for issue #${number}.`);
    return;
  }

  try {
    console.log(`Value object for issue #${number}:`, JSON.stringify(valueObject, null, 2));
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
    console.log(`Finished at: ${new Date().toTimeString()}`);
  } catch (error) {
    throw new Error(`Error updating assignee values in Monday.com: ${error}`);
  }
};
