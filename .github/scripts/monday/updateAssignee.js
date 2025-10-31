// @ts-check
const Monday = require("../support/monday");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { issue } =
    /** @type {import('@octokit/webhooks-types').IssuesAssignedEvent | import('@octokit/webhooks-types').IssuesUnassignedEvent } */ (
      context.payload
    );
  const monday = Monday(issue);
  monday.setAssignedStatus();
  monday.handleAssignees();
  await monday.commit();
};
