// @ts-check
const Monday = require("./support/monday.js");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { issue } =
    /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent | import('@octokit/webhooks-types').IssuesLabeledEvent}*/ (
      context.payload
    );
  const monday = Monday(issue);

  const id = await monday.createTask();

  // Add the Monday.com item ID to the issue body
  const updatedBody = monday.addSyncLine(id);
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
