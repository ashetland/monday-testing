// @ts-check
const { callMonday, getMondayID, handleMilestone } = require("./support/utils");
const { mondayBoard } = require("./support/resources");

// When a Milestone is added or updated:
// 1. Find ID of task in Issue Body, if not found, find in Monday
// 2. Update Due Date column value in Monday to Due Date of Milestone, or clear it if not found.
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload);
  const {
    body,
    number,
    milestone,
  } = payload.issue;

  /**
   * Update a column's value for a given Monday.com task.
   * @param {string} ID - the ID of the Monday.com task
   * @param {{ column: string, value: string }[]} values - an array of objects containing column IDs and values to update
   */
  function updateColumnValues(ID, values) {
    const valuesObject = {};
    values.forEach((value) => {
      valuesObject[value.column] = value.value;
    });

    const valuesString = JSON.stringify(valuesObject).replace(/"/g, '\\"');

    const query = `mutation { 
      change_multiple_column_values(
        board_id: ${mondayBoard},
        item_id: ${ID},
        column_values: "${valuesString}"
      ) {
        id
      }
    }`;

    try {
      callMonday(MONDAY_KEY, query);
    }
    catch (error) {
      throw new Error(`Error updating column value in Monday.com: ${error}`);
    }
  }

  const mondayID = await getMondayID(MONDAY_KEY, body, number);

  const columnValues = handleMilestone(milestone ? milestone.title : "");

  try {
    updateColumnValues(mondayID, columnValues);
  }
  catch (error) {
    console.error(`Failed to update Monday.com task for issue #${number}: ${error.message}`);
  }
};
