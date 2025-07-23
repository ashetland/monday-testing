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
   * @param {string} column - the ID of the column to update
   * @param {string} value - the value to set for the column
   */
  function updateColumnValue(ID, column, value) {
    const query = `mutation {
      change_column_value(
        board_id: "${mondayBoard}",
        item_id: "${ID}",
        column_id: "${column}",
        value: ${value}
      ) {
        id
      }
    }`

    callMonday(MONDAY_KEY, query);
  }

  const mondayRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
  const mondayRegexMatch = body?.match(mondayRegex);
  let mondayID = mondayRegexMatch && mondayRegexMatch[0] ? mondayRegexMatch[0] : "";

  if (!mondayID) {
    mondayID = await getMondayID(MONDAY_KEY, number);
  }

  const { column, value } = handleMilestone(milestone);

  updateColumnValue(mondayID, column, value);
};
