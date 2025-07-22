// @ts-check
import { callMonday, addSyncLine } from './support/utils.js';;
import { mondayBoard, mondayColumns, mondayIssueTypes, mondayStatuses, mondayPriorities, mondayPeople } from './support/resources.js';
import { create } from 'domain';
// import  from "./support/resources.js";

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { MONDAY_KEY } = process.env;
  const payload = /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent} */ (context.payload);
  const {
    title,
    url,
    body,
    number,
    labels,
    assignees,
  } = payload.issue;

  /**
   * Assigns a person to the Monday.com task object based on their GitHub username/role
   * @param {import('@octokit/webhooks-types').User} person
   * @param {object} values - The current column values object to update
   * @returns {Promise<object>} - The updated column values object
   */
  async function assignPerson(person, values) {
    if (!person?.login) {
      console.warn("No person or login provided for assignment");
      return;
    }

    const info = mondayPeople.get(person.login);

    if (!info) {
      console.warn(`Assignee ${person.login} not found in peopleMap`);
      return;
    }

    const currentValue = await callMonday(MONDAY_KEY, `query {
      boards(ids: ${mondayBoard}) {
        items(ids: ${number}) {
          column_values(ids: "${info.role}") {
            text
          }
        }
      }
    }`);

    // const columnValues = currentValue.data.boards[0].items[0].column_values;
    console.log(`Current value for ${info.role}:`, currentValue);

    // values[info.role] = `${info.id}`;

    return values;
  }

  /**
   * Assigns labels to the Monday.com task object based on the issue labels
   * @param {import('@octokit/webhooks-types').Label[]} labels - The labels from the issue
   * @param {object} values - The current column values object to update
   * @returns {object} - The updated column values object
   */
  function assignLabels(labels, values) {
    const issueTypes = [];
    const statuses = [];
    const priorities = [];

    for (const label of labels) {
      if (mondayIssueTypes.has(label.name)) {
        issueTypes.push(mondayIssueTypes.get(label.name));
        continue;
      }
      if (mondayStatuses.has(label.name)) {
        statuses.push(mondayStatuses.get(label.name));
        continue;
      }
      if (mondayPriorities.has(label.name)) {
        priorities.push(mondayPriorities.get(label.name));
        continue;
      }
    }

    if (!issueTypes.length) {
      values[mondayColumns.issue_type] = issueTypes.join(", ");
    }
    if (!statuses.length) {
      values[mondayColumns.status] = statuses.join(", ");
    }
    if (!priorities.length) {
      values[mondayColumns.priority] = priorities.join(", ");
    }
  }

  async function createColumnValues() {
    let values = {
      [mondayColumns.issue_id]: number,
      [mondayColumns.link]: {
        "url": url,
        "text": title
      },
    };

    if (assignees) {
      for (const person of assignees) {
        values = await assignPerson(person, values);
      }
    }

    if (labels) {
      values = assignLabels(labels, values);
    }

    return values;
  }

  let columnValues = JSON.stringify(await createColumnValues());
  // Escape double quotes for GraphQL
  columnValues = columnValues.replace(/"/g, '\\"');

  const query = `mutation { 
    create_item (
      board_id: ${mondayBoard},
      item_name: "${title}",
      column_values: "${columnValues}"
    ) {
      id
    }
  }`;
  console.log(query);

  const response = await callMonday(MONDAY_KEY, query);

  if (!response) {
    throw new Error(`No response for Github Issue #${number}`);
  }

  console.log(response["data"]);

  if (response && response["errors"]) {
    console.error(`Error creating Monday.com task: ${response["errors"][0]["message"]}, locations: ${response["errors"][0]["locations"]}`);
    throw new Error(`Error creating Monday.com task: ${response["errors"][0]["message"]}`);
  }

  const items = response["data"]["items_page_by_column_values"]["items"];

  if (!items?.length) {
    throw new Error(`No items found for Github Issue #${number}`);
  }

  const mondayID = items[0]["id"];

  const updatedBody = addSyncLine(body, mondayID);

  // Update the issue with the new body
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: number,
    body: updatedBody,
  });
};
