// @ts-check
const Monday = require("./support/monday.js");
const { mondayColumns } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { issue, changes } =
    /** @type {import('@octokit/webhooks-types').IssuesEditedEvent} */ (
      context.payload
    );
  const monday = Monday(issue);

  if (!changes.title) {
    console.log("No title change detected in the payload.");
    process.exit(0);
  }

  monday.setColumnValue(mondayColumns.title, issue.title);
  await monday.commitChanges();
};
