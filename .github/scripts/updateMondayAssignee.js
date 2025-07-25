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
    assignee,
  } = payload;

  if (!assignee) {
    console.log(`No new assignee found for issue #${number}. Skipping update.`);
    return;
  }

  const mondayID = getMondayID(MONDAY_KEY, body, number);
  if (!mondayID) {
    console.log(`No Monday ID found for issue #${number}. Skipping update.`);
    return;
  }

  const personInfo = mondayPeople.get(assignee.login);
  if (!personInfo) {
    console.log(
      `No Monday person info found for assignee ${assignee.login}. Skipping update.`,
    );
    return;
  }

  const existingRole = currentAssignees.some((assignee) => {
    const info = mondayPeople.get(assignee.login);
    if (info && info.role === personInfo.role) {
      return true;
    }
    return false;
  });

  const valuesObject = {};
  if (existingRole) {
    valuesObject[personInfo.role] = `, ${personInfo.id}`;
  } else {
    valuesObject[personInfo.role] = personInfo.id;
  }
  const valuesString = JSON.stringify(valuesObject).replace(/"/g, '\\"');

  const query = `mutation {
    change_multiple_column_values (
      board_id: ${mondayBoard},
      item_id: ${mondayID},
      column_values: "${valuesString}"
    ) {
      id
    }
  }`;

  await callMonday(MONDAY_KEY, query);
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
