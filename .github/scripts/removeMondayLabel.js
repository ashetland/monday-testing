// @ts-check
const { callMonday, getMondayID } = require("./support/utils");
const { mondayBoard, mondayLabels, resources } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const { issue, label } =
    /** @type {import('@octokit/webhooks-types').IssuesUnlabeledEvent} */ (
      context.payload
    );

  if (!label || !label.name) {
    console.log("No label found in the payload.");
    return;
  }

  const isSpike = label.name === resources.labels.planning.spike;
  if (isSpike && issue.labels) {
    const isSpikeComplete = issue.labels.some((label) => label.name === resources.labels.planning.spikeComplete);
    if (isSpikeComplete) {
      console.log("Issue is marked as a spike complete. Skipping label removal.");
      return;
    }
  }
  
  const mondayID = await getMondayID(MONDAY_KEY, issue.body, issue.number);

  if (!mondayLabels.has(label.name)) {
    console.log(`Label '${label.name}' is not a recognized Monday.com label.`);
    return;
  }

  const column = mondayLabels.get(label.name)?.column;

  const query = `mutation {
    change_simple_column_value(
      board_id: ${mondayBoard},
      item_id: ${mondayID},
      column_id: "${column}",
      value: ""
    ) {
      id
    }
  }`;

  const response = await callMonday(MONDAY_KEY, query);
  if (!response || !response["data"]["change_simple_column_value"]) {
    throw new Error(
      `Failed to remove label from Monday.com task: ${JSON.stringify(response)}`,
    );
  }

  console.log(`Cleared '${label.name}' from '${column}' on Monday.com task ID ${mondayID}.`);
}
