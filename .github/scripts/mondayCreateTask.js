// @ts-check
const {
  callMonday,
  addSyncLine,
  createTaskQuery,
} = require("./support/utils");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { MONDAY_KEY } = process.env;
  const { issue } =
    /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent | import('@octokit/webhooks-types').IssuesLabeledEvent}*/ (
      context.payload
    );

  const response = await callMonday(MONDAY_KEY, createTaskQuery(issue));
  if (
    !response ||
    !response["data"] ||
    !response["data"]["create_item"]["id"]
  ) {
    console.log(`Missing or bad response for Github Issue #${issue.number}`);
    process.exit(1);
  }

  // Add the Monday.com item ID to the issue body
  const updatedBody = addSyncLine(issue.body, response["data"]["create_item"]["id"]);
  try {
    await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issue.number,
      body: updatedBody,
    });
    process.exit(0);
  } catch (error) {
    console.log(`Error adding ID to body: ${error}`);
    process.exit(1);
  }
};
