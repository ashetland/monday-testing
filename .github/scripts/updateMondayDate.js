// @ts-check
// When a Milestone is added or updated:
// 1. Find ID of task in Issue Body, if not found, find in Monday
// 2. Update Due Date column value in Monday to Due Date of Milestone, or clear it if not found.
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const BOARD = "8780429793";
  const COLUMN_ID = "numeric_mknk2xhh";
  const COLUMN_DATE = "date6";
  const { MONDAY_KEY } = process.env;

  const payload = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload);

  /**
   * @typedef {object} Issue
   * @property {string} body
   * @property {string} number
   * @property {object} milestone
   * @property {string} milestone.title
   */

  /** @type {Issue} */
  const {
    body,
    number: issueNumber,
    milestone: {
      title: milestone
    }
  } = payload.issue;

  /**
   * Calls the Monday.com API with a provided query
   * @param {string} query
   * @returns {Promise<string | undefined>}
   */
  async function callMonday(query) {
    try {
      const response = await fetch("https://api.monday.com/v2", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: MONDAY_KEY,
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        console.log(body);
        throw new Error(`HTTP error when callid the Monday API: ${body}`);
      }

      return body;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Returns the Monday.com task ID for the passed GitHub Issue ID.
   * Matches based on the GitHub Issue ID column.
   * @param {string} githubID 
   * @returns {Promise<string>} 
   */
  async function getMondayID(githubID) {
    const query = `query {
      items_page_by_column_values(
        board_id: "${BOARD}",
        columns: {
          column_id: "${COLUMN_ID}",
          column_values: ["${githubID}"]
        },
      ) {
        items {
          id
        }
      }
    }`;

    const response = await callMonday(query);

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
        board_id: "${BOARD}",
        item_id: "${ID}",
        column_id: "${COLUMN_DATE}",
        value: ${valueEscaped}
      ) {
        id
      }
    }`

    callMonday(query);
  }

  const dateRegex = /\d{4}-\d{2}-\d{2}/;
  const dueDate = milestone.match(dateRegex);
  const dateArgument = dueDate ? dueDate[0] : "";

  const mondayRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
  const mondayRegexMatch = body.match(mondayRegex);
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
    console.log(`Issue #${issueNumber}'s date cleared.`);
  }
};
