// @ts-check
const { updateMultipleColumns } = require("./support/utils");
const {
  mondayColumns,
  resources: {
    labels: {
      issueType: { design },
    },
  },
} = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const {
    issue: { number, body, labels, state_reason },
    action,
  } =
    /** @type {import('@octokit/webhooks-types').IssuesClosedEvent | import('@octokit/webhooks-types').IssuesReopenedEvent}*/ (
      context.payload
    );

  const valueObject = {
    [mondayColumns.open]: "Closed",
  };

  if (action === "reopened") {
    valueObject[mondayColumns.open] = "Open";
  } else {
    // If closed but not completed, set status to "Closed"
    if (state_reason !== "completed") {
      valueObject[mondayColumns.status] = "Closed";
    }
    // If not a design issue, set status to "Done"
    else if (labels && labels.every((label) => label.name !== design)) {
      valueObject[mondayColumns.status] = "Done";
    }
  }

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
    process.exit(0);
  } catch (error) {
    console.log(`Error updating Monday.com task: ${error}`);
    process.exit(1);
  }
};
