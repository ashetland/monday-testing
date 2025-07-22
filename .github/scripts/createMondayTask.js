// @ts-check
const { callMonday, addSyncLine } = require("./support/utils");
const { monday } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent} */ (
      context.payload
    );
  const { title, url, body, number, labels, assignees } = payload.issue;

  /**
   * Assigns a person to the Monday.com task object based on their GitHub username/role
   * @param {import('@octokit/webhooks-types').User} person
   * @param {object} values - The current column values object to update
   * @returns {object} - The updated column values object
   */
  function assignPerson(person, values) {
    if (!person?.login) {
      console.warn("No person or login provided for assignment");
      return;
    }

    const info = monday.people.get(person.login);

    if (!info) {
      console.warn(`Assignee ${person.login} not found in peopleMap`);
      return;
    }

    if (!values[info.role]) {
      values[info.role] = `${info.id}`;
    } else {
      values[info.role] += `, ${info.id}`;
    }

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
      if (monday.issueTypes.has(label.name)) {
        issueTypes.push(monday.issueTypes.get(label.name));
        continue;
      }
      if (monday.statuses.has(label.name)) {
        statuses.push(monday.statuses.get(label.name));
        continue;
      }
      if (monday.priorities.has(label.name)) {
        priorities.push(monday.priorities.get(label.name));
        continue;
      }
    }

    if (issueTypes.length) {
      values[monday.columns.issue_type] = issueTypes.join(", ");
    }
    if (statuses.length) {
      values[monday.columns.status] = statuses.join(", ");
    }
    if (priorities.length) {
      values[monday.columns.priority] = priorities.join(", ");
    }

    return values;
  }

  /**
   * Creates the GraphQL query to create a new item in Monday.com
   * @returns {string} - The GraphQL query string
   */
  function createTaskQuery() {
    let values = {
      [monday.columns.issue_id]: number,
      [monday.columns.link]: {
        url: url,
        text: title,
      },
    };

    if (assignees) {
      for (const person of assignees) {
        values = assignPerson(person, values);
      }
    }

    if (labels) {
      values = assignLabels(labels, values);
    }

    // Escape double quotes for GraphQL
    const valuesString = JSON.stringify(values).replace(/"/g, '\\"');

    const query = `mutation { 
      create_item (
        board_id: ${monday.board},
        item_name: "${title}",
        column_values: "${valuesString}"
      ) {
        id
      }
    }`;
    console.log(query);

    return query;
  }

  
  const response = await callMonday(MONDAY_KEY, createTaskQuery());

  if (!response || !response["data"] || !response["data"]["create_item"]["id"]) {
    throw new Error(`Missing or bad response for Github Issue #${number}`);
  }

  const mondayID = response["data"]["create_item"]["id"];

  const updatedBody = addSyncLine(body, mondayID);

  // Update the issue with the new body
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: number,
    body: updatedBody,
  });
};
