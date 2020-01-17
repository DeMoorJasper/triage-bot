import * as core from '@actions/core';
import * as github from '@actions/github';
import * as Octokit from '@octokit/rest';
import matcher from 'matcher';

type Issue = Octokit.IssuesGetResponse;

type Args = {
  repoToken: string;
  configPath: string;
};

type TriageBotConfig = {
  labels: Array<{
    label: string;
    globs: Array<string>;
    message?: string;
  }>;
  comment?: string;
  no_label_comment?: string;
};

async function run() {
  try {
    const args = getAndValidateArgs();

    let issue = github.context.payload.issue;
    if (!issue) {
      core.error(
        'No issue context found. This action can only run on issue creation.'
      );
      return;
    }

    core.info('Starting GitHub Client');
    const client = new github.GitHub(args.repoToken);

    core.info(`Loading config file at ${args.configPath}`);
    const config = await getConfig(client, args.configPath);

    console.log(config);

    await processIssue(client, config, issue.number);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

async function processIssue(
  client: github.GitHub,
  config: TriageBotConfig,
  issueId: number
) {
  let issue: Issue = await getIssue(client, issueId);

  if (issue.labels.length > 0) {
    console.log('This issue already has labels, skipping...');
    return;
  }

  let matchingLabels: Array<string> = [];
  let comments: Array<string> = config.comment ? [config.comment] : [];
  let lines = issue.body.split(/\r?\n|\r/g);
  for (let label of config.labels) {
    if (matcher(lines, label.globs).length > 0) {
      matchingLabels.push(label.label);

      if (label.message) {
        comments.push(label.message);
      }
    }
  }

  if (matchingLabels.length > 0) {
    console.log(
      `Adding labels ${matchingLabels.join(', ')} to issue #${issue.number}`
    );

    await addLabels(client, issue.number, matchingLabels);

    if (comments.length) {
      await writeComment(client, issue.number, comments.join('\n\n'));
    }
  } else if (config.no_label_comment) {
    console.log(
      `Adding comment to issue #${issue.number}, because no labels match`
    );

    await writeComment(client, issue.number, config.no_label_comment);
  }
}

async function writeComment(
  client: github.GitHub,
  issueId: number,
  body: string
) {
  await client.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueId,
    body: body
  });
}

async function addLabels(
  client: github.GitHub,
  issueId: number,
  labels: Array<string>
) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueId,
    labels
  });
}

async function getIssue(
  client: github.GitHub,
  issueId: number
): Promise<Issue> {
  return (
    await client.issues.get({
      issue_number: issueId,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    })
  ).data;
}

async function getConfig(
  client: github.GitHub,
  configPath: string
): Promise<TriageBotConfig> {
  const response = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: configPath,
    ref: github.context.sha
  });

  // @ts-ignore
  return JSON.parse(Buffer.from(response.data.content, 'base64').toString());
}

function getAndValidateArgs(): Args {
  const args = {
    repoToken: core.getInput('repo-token', {required: true}),
    configPath: core.getInput('config-path', {required: true})
  };

  return args;
}

run();
