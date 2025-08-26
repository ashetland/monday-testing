// @ts-check
const {
  resources: {
    labels: {
      issueWorkflow: { needsMilestone, readyForDev },
    },
  },
} = require("./support/resources");
const {
  notReadyForDev,
  assignLabel,
  updateMultipleColumns,
} = require("./support/utils");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const { issue, label } =
    /** @type {import('@octokit/webhooks-types').IssuesLabeledEvent} */ (
      context.payload
    );
  const labelName = label?.name;

  if (!labelName) {
    console.log("No label found in the payload.");
    process.exit(0);
  }

  // Skip "needs milestone" if "ready for dev" is applied
  if (labelName === needsMilestone && !notReadyForDev(issue.labels)) {
    console.log(
      `Skipping '${needsMilestone}' label as '${readyForDev}' is already applied.`,
    );
    process.exit(0);
  }

  try {
    await updateMultipleColumns(
      MONDAY_KEY,
      issue.body,
      issue.number,
      assignLabel(labelName, {}),
    );
    console.log(`Finished at: ${new Date().toTimeString()}`);
    process.exit(0);
  } catch (error) {
    console.log(
      `Error updating Monday.com task with label '${labelName}': ${error}`,
    );
    process.exit(1);
  }
};
