// @ts-check
const { callMonday, getMondayID } = require("./support/utils");
const { mondayBoard, mondayPeople } = require("./support/resources");

// When a Milestone is added or updated:
// 1. Find ID of task in Issue Body, if not found, find in Monday
// 2. Update Due Date column value in Monday to Due Date of Milestone, or clear it if not found.
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesAssignedEvent} */ (
      context.payload
    );
  const {
    issue: { number, body, assignees: currentAssignees },
    assignee: newAssignee,
  } = payload;

  if (!newAssignee) {
    console.log(`No new assignee found for issue #${number}. Skipping update.`);
    return;
  }

  const mondayID = await getMondayID(MONDAY_KEY, body, number);
  if (!mondayID) {
    console.log(`No Monday ID found for issue #${number}. Skipping update.`);
    return;
  }

  const personInfo = mondayPeople.get(newAssignee.login);
  if (!personInfo) {
    console.log(
      `No Monday person info found for assignee ${newAssignee.login}. Skipping update.`,
    );
    return;
  }

  let valueString = "";
  currentAssignees.forEach((assignee) => {
    if (assignee.login === newAssignee.login) {
      return;
    }

    const info = mondayPeople.get(assignee.login);
    if (info && info.role === personInfo.role) {
      if (valueString) {
        valueString += `, `;
      }

      valueString += `${info.id}`;
    }
  });

  if (valueString) {
    valueString += `, ${personInfo.id}`;
  } else {
    valueString = `${personInfo.id}`;
  }

  const query = `mutation {
    change_simple_column_value (
      board_id: ${mondayBoard},
      item_id: ${mondayID},
      column_id: "${personInfo.role}",
      value: "${valueString}"
    ) {
      id
    }
  }`;

  const response = await callMonday(MONDAY_KEY, query);
  if (!response || !response["data"] || !response["data"]["change_simple_column_value"]) {
    throw new Error(
      `Failed to update Monday board for issue #${number}. Response: ${JSON.stringify(response)}`,
    );
  }
};
// const currentValue = await callMonday(MONDAY_KEY, `query {
//   items (ids: [${number}]) {
//     column_values(ids: "${info.role}") {
//       ... on PeopleValue {
//          persons_and_teams {
//           id
//         }
//       }
//     }
//   }
// }`);
//
// // const valuesObject = currentValue.data.boards[0].items[0].column_values;
// console.log(`Current value for ${info.role}:`, currentValue);
