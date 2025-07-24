// @ts-check
const { callMonday, getMondayID, handleMilestone } = require("./support/utils");
const { mondayBoard, mondayColumns } = require("./support/resources");

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
    milestone: {
      title: milestone
    }
  } = payload.issue;

  /**
   * Update a column's value for a given Monday.com task.
   * @param {string} ID - the ID of the Monday.com task
   * @param {{ column: string, value: string }[]} values - an array of objects containing column IDs and values to update
   */
  function updateColumnValues(ID, values) {
    const valuesObject = values.map((value) => {
      return `"${value.column}": "${value.value}"`;
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

  const mondayRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
  const mondayRegexMatch = body?.match(mondayRegex);
  let mondayID = mondayRegexMatch && mondayRegexMatch[0] ? mondayRegexMatch[0] : "";

  if (!mondayID) {
    mondayID = await getMondayID(MONDAY_KEY, number);
  }

  const columnValues = handleMilestone(milestone);

  try {
    updateColumnValues(mondayID, columnValues);
  }
  catch (error) {
    console.error(`Failed to update Monday.com task for issue #${number}: ${error.message}`);
  }
};
