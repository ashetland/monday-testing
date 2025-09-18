// @ts-check
const Monday = require("../support/monday");
const { assertRequired } = require("../support/utils");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const [issueNumber, labelName] = assertRequired([context.payload.issue_number, context.payload.label_name]);

  const { data: issue } = await github.rest.issues.get({
    ...context.repo,
    issue_number: issueNumber,
  });
  console.log(`Issue fetched: #${issue.number} - ${issue.title}`);

  const monday = Monday(issue);
  monday.addLabel(labelName);
  monday.handleMilestone();
  monday.addAllAssignees();
  await monday.commit();
};
