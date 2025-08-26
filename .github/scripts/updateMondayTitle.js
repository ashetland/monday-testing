// @ts-check
const { updateMultipleColumns } = require("./support/utils");
const { mondayColumns } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const { issue, changes } =
    /** @type {import('@octokit/webhooks-types').IssuesEditedEvent} */ (
      context.payload
    );
  
  if(!changes.title) {
    console.log("No title change detected in the payload.");
    process.exit(0);
  }

  const valueObject = { [mondayColumns.title]: issue.title }

  try {
    await updateMultipleColumns(MONDAY_KEY, issue.body, issue.number, valueObject);
    process.exit(0);
  } catch (error) {
    console.log(`Error updating Monday.com task title: ${error}`);
    process.exit(1);
  }
}
