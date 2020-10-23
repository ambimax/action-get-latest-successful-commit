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
        console.log("workflow_id: ", workflow_id);
    } else {
        workflow_id = core.getInput("workflow_id", { required: true });
    }

    const response = await oktokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id,
        status: "success" as never, // typings are wrong
        branch: core.getInput("branch"),
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

    if (commits.length > 0) {
        core.setOutput("has_commit", true);
        core.setOutput("commit_author_name", commits[commits.length - 1].author.name);
        core.setOutput("commit_author_email", commits[commits.length - 1].author.email);
        core.setOutput("commit_committer_name", commits[commits.length - 1].committer.name);
        core.setOutput("commit_committer_email", commits[commits.length - 1].committer.email);
        core.setOutput("commit_message", commits[commits.length - 1].message);
        core.setOutput("commit_timestamp", commits[commits.length - 1].timestamp);
        core.setOutput("commit_tree_id", commits[commits.length - 1].tree_id);
        core.setOutput("commit_sha", commits[commits.length - 1].id);
        core.setOutput("commit_sha_short", commits[commits.length - 1].id.slice(0, 7));
    } else {
        core.setOutput("has_commit", false);
    }
}

run().catch(console.error);
