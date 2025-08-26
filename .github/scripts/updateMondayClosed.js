// @ts-check
const { updateMultipleColumns } = require("./support/utils");
const { mondayColumns, resources } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesClosedEvent | import('@octokit/webhooks-types').IssuesReopenedEvent}*/ (
      context.payload
    );
  const {
    issue: { number, body, labels, state_reason },
    action,
  } = payload;
  console.log(`Reason: ${state_reason}`);
  const closedReasons = ["wontfix", "not_planned", "duplicate"];

  const valueObject = {
    [mondayColumns.open]: "Closed",
  };

  if (action === "reopened") {
    valueObject[mondayColumns.open] = "Open";
  } else {
    // If closed but not completed, set status to "Closed"
    if (state_reason && closedReasons.includes(state_reason)) {
      valueObject[mondayColumns.status] = "Closed";
    }
    // If not a design issue, set status to "Done"
    else if (
      labels &&
      labels.every((label) => label.name !== resources.labels.issueType.design)
    ) {
      valueObject[mondayColumns.status] = "Done";
    }
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
  } catch (error) {
    throw new Error(`Error updating Monday.com task: ${error}`);
  }
};
