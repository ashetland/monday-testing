// @ts-check
const { callMonday, addSyncLine } = require('./support/utils.js');
const { mondayBoard, mondayColumns } = require("./support/resources.js");
// const { mondayBoard, mondayColumns } = require("./support/resources.js");

// When the `monday.com sync` label is added to an issue:
// 1. Get the ID of the task in Monday.com
// 2. Add ID to the Issue Summary
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { MONDAY_KEY } = process.env;
  const payload = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload);
  const {
    issue: { 
      body,
      number,
      labels
    },
  } = payload;

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

  const mondayID = await getMondayID(number);
  const updatedBody = addSyncLine(body, mondayID);

  // Update the issue with the new body
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: number,
    body: updatedBody,
  }); 

  if (labels) {
    /** @type {Array<string>} */ 
    let labelsToReset = [];
    /** @type {Array<string>} */ 
    const resetLabelNames = ["bug", "enhancement", "a11y", "docs", "refactor", "spike", "testing", "tooling"];
    // "new component" is the other issue type, but it triggers notifications

    for (const label of labels) {
      if (!resetLabelNames.includes(label.name)) {
        continue;
      }

      await github.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: number,
        name: label.name,
      });

      labelsToReset.push(label.name);
    }

    await github.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: number,
      labels: labelsToReset,
    });
  }
}
