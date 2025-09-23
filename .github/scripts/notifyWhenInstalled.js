// @ts-check
const {
  labels: { issueWorkflow },
} = require("./support/resources");
const { removeLabel } = require("./support/utils");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { repo, owner } = context.repo;

  const payload = /** @type {import('@octokit/webhooks-types').IssuesLabeledEvent} */ (context.payload);
  const number = payload.issue.number;

  const { ISSUE_VERIFIERS } = process.env;

  await removeLabel({ github, context, label: issueWorkflow.inDevelopment });

  const verifiers = ISSUE_VERIFIERS?.split(",").map((v) => v.trim());

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body: `Installed for verification: ${verifiers}`,
  });
};

