// @ts-check
const { mondayLabels, mondayPeople } = require("./resources");

module.exports = {
  /**
   * @typedef {object} removeLabelParam
   * @property {InstanceType<typeof import('@actions/github/lib/utils').GitHub>} github
   * @property {import('@actions/github/lib/context').Context} context
   * @property {string} label
   *
   * @param {removeLabelParam} obj
   **/
  removeLabel: async ({ github, context, label }) => {
    const { owner, repo } = context.repo;
    const issue_number = context.issue.number;

    try {
      await github.rest.issues.removeLabel({
        issue_number,
        owner,
        repo,
        name: label,
      });
    } catch (err) {
      if (err.status === 404) {
        console.log(`The label '${label}' is not associated with issue #${issue_number}.`, err);
      } else {
        console.log("Error while attempting to remove issue label.", err);
      }
    }
  },

  /**
   * @typedef {object} createLabelIfMissingParam
   * @property {InstanceType<typeof import('@actions/github/lib/utils').GitHub>} github
   * @property {import('@actions/github/lib/context').Context} context
   * @property {string} label
   * @property {string} color
   * @property {string} description
   *
   * @param {createLabelIfMissingParam} obj
   **/
  createLabelIfMissing: async ({ github, context, label, color, description }) => {
    const { owner, repo } = context.repo;
    try {
      await github.rest.issues.getLabel({
        owner,
        repo,
        name: label,
      });
    } catch {
      await github.rest.issues.createLabel({
        owner,
        repo,
        name: label,
        color,
        description,
      });
    }
  },

  /**
   * Calls the Monday.com API with a provided query
   * @param {string | undefined} key - The Monday.com API key
   * @param {string} query - The GraphQL query to execute
   * @returns {Promise<string | undefined>}
   */
  callMonday: async (key, query) => {
    try {
      if (!key) {
        throw new Error("Monday.com API key is not set.");
      }

      const response = await fetch("https://api.monday.com/v2", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: key,
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        console.log(body);
        throw new Error(`HTTP error when callid the Monday API: ${body}`);
      }

      return body;
    } catch (error) {
      console.log(error);
    }
  },
  /**
   * Inserts or replaces the Monday sync line in the issue body string
   * @param {string | null} body - The current issue body
   * @param {string} mondayID - The Monday.com item ID
   * @returns {string} - The updated issue body
   */
  addSyncLine: (body, mondayID) => {
    const syncMarkdown = `**monday.com sync:** #${mondayID}\n\n`;
    const syncLineRegex = /^\*\*monday\.com sync:\*\* #\d+\n\n?/m;
    if (body && syncLineRegex.test(body)) {
      return body.replace(syncLineRegex, syncMarkdown);
    } else {
      return syncMarkdown + (body || '');
    }
  },
  /**
   * Assigns labels to the Monday.com task object based on the issue labels
   * @param {import('@octokit/webhooks-types').Label[]} labels - The labels from the issue
   * @param {object} values - The current column values object to update
   * @returns {object} - The updated column values object
   */
  assignLabels: (labels, values) => {
    for (const label of labels) {
      // TEMP
      if (label.name === "monday.com sync") {
        // Skip the sync label, as it is not needed in Monday.com
        continue;
      }

      if (!mondayLabels.has(label.name)) {
        console.warn(`Label ${label.name} not found in Monday Labels map`);
        continue;
      }

      const info = mondayLabels.get(label.name);
      if (!info?.column || !info?.value) {
        console.warn(`Label ${label.name} is missing column or title information`);
        continue;
      }

      if (!values[info.column]) {
        values[info.column] = info.value;
      } else {
        values[info.column] += `, ${info.value}`;
      }
    }

    return values;
  },
  /**
   * Assigns a person to the Monday.com task object based on their GitHub username/role
   * @param {import('@octokit/webhooks-types').User} person
   * @param {object} values - The current column values object to update
   * @returns {object} - The updated column values object
   */
  assignPerson: (person, values) => {
    if (!person?.login) {
      console.warn("No person or login provided for assignment");
      return;
    }

    const info = mondayPeople.get(person.login);

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
  },
};
