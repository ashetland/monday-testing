// @ts-check
// When a Milestone is added or updated:
// 1. Leaves a comment on all the issues listed as blocked in body,

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const BOARD = "8780429793";
  const COLUMN_ID = "numeric_mknk2xhh";
  const COLUMN_DATE = "date6";
  const { MONDAY_KEY } = process.env;
  const issue = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload?.issue);


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
   * @param {string} dateString
   */
  function updateDueDate(ID, dateString) {
    const value = JSON.stringify({
      date: dateString.split('T')[0]
    });
    const valueEscaped = value.replace(/"/g, '\\"');

    console.log(`Date JSON String: ${valueEscaped}`);

    const query = `mutation {
      change_column_value(
        board_id: "${BOARD}",
        item_id: "${ID}",
        column_id: "${COLUMN_DATE}",
        value: "${valueEscaped}"
      ) {
        id
      }
    }`

    callMonday(query);
  }

  if (issue?.milestone?.due_on) {
    const issueNumber = issue.number;
    const dueDate = issue.milestone.due_on;

    console.log(`A milestone was created/updated on issue #${issueNumber}`);
    console.log(`Milestone Due Date: ${dueDate}`);

    getMondayID(issueNumber).then(mondayID => {
      console.log(`Monday ID: ${mondayID}`);

      updateDueDate(mondayID, dueDate);
      console.log("Due Date Updated");
    });
    
  } else {
    console.log(`No milestone found for issue #${issue.number}.`);
  }
};
