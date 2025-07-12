// @ts-check
// When the `monday.com sync` label is added to an issue:
// 1. Get the ID of the task in Monday.com
// 2. Add ID to the Issue Summary
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const BOARD = "8780429793";
  const COLUMN_ID = "numeric_mknk2xhh";
  const { MONDAY_KEY } = process.env;
  const payload = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload);
  const {
    issue: { 
      body,
      number: issueNumber,
      labels
    },
  } = payload;

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
        throw new Error(`HTTP error when calling the Monday API: ${body}`);
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

  const mondayID = await getMondayID(issueNumber);
  const syncMarkdown = `**monday.com sync:** #${mondayID}\n\n`;
  let updatedBody = syncMarkdown;

  if (body) {
    updatedBody += body;
  }

  // Update the issue with the new body
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    body: updatedBody,
  }); 

  /** @type {Array<string>} */ 
  let labelNames = [];

  for (const label of labels) {
    await github.rest.issues.removeLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      name: label.name,
    });
    
    labelNames.push(label.name);
  }
  
  await github.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    labels: labelNames,
  });

  console.log(`Adding ${syncMarkdown} to Issue #${issueNumber}`);
}
