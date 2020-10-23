import * as core from "@actions/core";
import * as github from "@actions/github";
import { env } from "./env";

declare global {
    namespace Ambimax {
        interface Env {
            GITHUB_REPOSITORY: string;
        }
    }
}

// Action is based on https://stackoverflow.com/a/62378683

export async function run() {
    const oktokit = github.getOctokit(core.getInput("github_token", { required: true }));

    const [owner, repo] = (core.getInput("repository", { required: false }) ?? env.GITHUB_REPOSITORY).split("/", 2);

    let workflow_id: any;
    if (core.getInput("run_id")) {
        const result = await oktokit.actions.getWorkflowRun({
            owner,
            repo,
            run_id: core.getInput("run_id") as any,
        });
        workflow_id = result.data.workflow_id;
    } else {
        workflow_id = core.getInput("workflow_id", { required: true });
    }

    const response = await oktokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id,
        status: "success" as never, // typings are wrong
        branch: getBranch(),
    });

    const commits = response.data.workflow_runs
        .map((workflowRun) => workflowRun.head_commit)
        .sort((a, b) => {
            const aDate = new Date(a.timestamp);
            const bDate = new Date(b.timestamp);

            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;

            return 0;
        });

    let output: any;
    if (commits.length > 0) {
        output = {
            has_commit: true,
            workflow_id,
            commit_author_name: commits[commits.length - 1].author.name,
            commit_author_email: commits[commits.length - 1].author.email,
            commit_committer_name: commits[commits.length - 1].committer.name,
            commit_committer_email: commits[commits.length - 1].committer.email,
            commit_message: commits[commits.length - 1].message,
            commit_timestamp: commits[commits.length - 1].timestamp,
            commit_tree_id: commits[commits.length - 1].tree_id,
            commit_sha: commits[commits.length - 1].id,
            commit_sha_short: commits[commits.length - 1].id.slice(0, 7),
        };
    } else {
        output = {
            has_commit: false,
            workflow_id,
        };
    }

    console.log("Available outputs:");
    for (const key in output) {
        console.log(`    ${key}: ${output[key]}`);
        core.setOutput(key, output[key]);
    }
}

function getBranch() {
    const branch = core.getInput("branch");

    const headsPrefix = "refs/heads/";
    if (branch.startsWith(headsPrefix)) {
        return branch.slice(headsPrefix.length);
    }

    return branch;
}

run().catch(console.error);
