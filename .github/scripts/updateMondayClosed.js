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
    issue: { number, body, labels },
    action,
  } = payload;
  const reason = payload.issue.state_reason;
  const closedReasons = ["wontfix", "not_planned", "duplicate"];

  const valueObject = {
    [mondayColumns.open]: "Closed",
  };

  if (action === "reopened") {
    valueObject[mondayColumns.open] = "Open";
  } else {
    if (reason && closedReasons.includes(reason)) {
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
