// @ts-check
import { callMonday } from "./support/utils.js";
import { mondayBoard, mondayColumns } from "./support/resources.js";

// When a Milestone is added or updated:
// 1. Find ID of task in Issue Body, if not found, find in Monday
// 2. Update Due Date column value in Monday to Due Date of Milestone, or clear it if not found.
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload);
  const {
    body,
    number: issueNumber,
    milestone: {
      title: milestone
    }
  } = payload.issue;

  /**
   * Returns the Monday.com task ID for the passed GitHub Issue ID.
   * Matches based on the GitHub Issue ID column.
   * @param {number} githubID 
   * @returns {Promise<string>} 
   */
  async function getMondayID(githubID) {
    const query = `query {
      items_page_by_column_values(
        board_id: "${mondayBoard}",
        columns: {
          column_id: "${mondayColumns.issue_id}",
          column_values: ["${githubID}"]
        },
      ) {
        items {
          id
        }
      }
    }`;

    const response = await callMonday(MONDAY_KEY, query);

    if (!response) {
      throw new Error(`No response for Github Issue #${githubID}`);
    }

    const items = response["data"]["items_page_by_column_values"]["items"];
    
    if (!items?.length) {
      throw new Error(`No items found for Github Issue #${githubID}`);
    }

    return items[0]["id"];
  }

  /**
   * Update the Due Date column value for a Monday.com task.
   * @param {string} ID 
   * @param {string} date 
   */
  function updateDueDate(ID, date) {
    const value = JSON.stringify({ "date": date });
    const valueEscaped = JSON.stringify(value);

    const query = `mutation {
      change_column_value(
        board_id: "${mondayBoard}",
        item_id: "${ID}",
        column_id: "${mondayColumns.date}",
        value: ${valueEscaped}
      ) {
        id
      }
    }`

    callMonday(MONDAY_KEY, query);
  }

  const dateRegex = /\d{4}-\d{2}-\d{2}/;
  const dueDate = milestone.match(dateRegex);
  const dateArgument = dueDate ? dueDate[0] : "";

  const mondayRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
  const mondayRegexMatch = body?.match(mondayRegex);
  let foundMondayID = mondayRegexMatch && mondayRegexMatch[0] ? mondayRegexMatch[0] : "";

  if (foundMondayID) {
    updateDueDate(foundMondayID, dateArgument);
  } else {
    getMondayID(issueNumber).then(mondayID => {
      updateDueDate(mondayID, dateArgument);
    });
  }

  if (dateArgument) {
    console.log(`Issue #${issueNumber}'s date updated to: ${dateArgument}`);
  } else {
    console.log(`Issue #${issueNumber}'s date has been cleared.`);
  }
};
