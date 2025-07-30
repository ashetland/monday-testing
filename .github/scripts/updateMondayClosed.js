// @ts-check
const { updateMultipleColumns } = require("./support/utils");
const { mondayColumns } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesClosedEvent | import('@octokit/webhooks-types').IssuesReopenedEvent}*/ (
      context.payload
    );
  const {
    issue: { number, body },
    action,
  } = payload;

  console.log(payload.issue.state_reason);

  const valueObject = {
    [mondayColumns.open]: "Closed",
    [mondayColumns.status]: "Done",
  };

  if (action === "reopened") {
    valueObject[mondayColumns.open] = "Open";
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
  } catch (error) {
    throw new Error(`Error updating Monday.com task: ${error}`);
  }
}
