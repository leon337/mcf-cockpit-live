const fs = require('fs');
const path = require('path');

const OWNER = 'leon337';
const PRIMARY = 'multiagent-collaboration-framework';
const LIVE_BRANCH = 'main';
const LIVE_DASHBOARD_PATH = 'artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/LIVE-DASHBOARD.json';
const REPO_ALLOWLIST = [
  'multiagent-collaboration-framework',
  'cloud-infrastructure',
  'mcf-control-center',
  'mcf-evaluation-lab',
  'mcf-long-mission-public',
  'mcf-product-lab',
  'cognitive-ledger',
  'triview-workspace-linux',
  'predixai-platform',
  'predixai-chatgpt-lab'
];

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'mcf-cockpit-live',
  'X-GitHub-Api-Version': '2022-11-28'
};

async function jsonFetch(url, accept) {
  const response = await fetch(url, {
    headers: accept ? { ...headers, Accept: accept } : headers
  });
  if (!response.ok) {
    const error = new Error('GitHub request failed: ' + response.status + ' ' + url);
    error.status = response.status;
    throw error;
  }
  if (accept && accept.includes('raw')) return response.text();
  return response.json();
}

async function safeFetch(url, accept, fallbackValue) {
  try {
    return await jsonFetch(url, accept);
  } catch {
    return fallbackValue;
  }
}

function missionFromLive(live) {
  if (!live) return null;
  const issueMatch = live.links && live.links.issue
    ? String(live.links.issue).match(/\/issues\/(\d+)/)
    : null;
  const checks = (live.roadmap || []).map((item) => {
    const status = String(item.status || '');
    const done = /PASS|STABLE|COMPLETED|DONE/.test(status) && !/PENDING|BLOCKED/.test(status);
    return { done, text: item.id + ' — ' + item.name + ' — ' + status.replaceAll('_', ' ') };
  });
  const done = checks.filter((x) => x.done).length;
  const body = [
    '# ' + (live.title || 'MCF Harness V2'),
    '',
    '**Status:** ' + (live.status || 'UNKNOWN'),
    '**Fase:** ' + (live.current_phase || 'UNKNOWN'),
    '',
    '## Roadmap',
    ...checks.map((x) => '- [' + (x.done ? 'x' : ' ') + '] ' + x.text)
  ].join('\n');
  return {
    number: issueMatch ? Number(issueMatch[1]) : 234,
    title: live.status === 'ENTREGUE' ? 'MCF-Harness V2 — 2.0.0 ENTREGUE' : (live.title || 'MCF Harness V2'),
    state: live.status === 'ENTREGUE' ? 'closed' : 'open',
    url: live.links && live.links.issue,
    updatedAt: live.updated_at,
    createdAt: null,
    body,
    labels: [],
    checklist: checks,
    progress: checks.length ? Math.round((done / checks.length) * 100) : null
  };
}

function parseAgents(markdown) {
  const rows = String(markdown || '').split('\n');
  const agents = [];
  for (const line of rows) {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (!match) continue;
    const number = Number(match[1]);
    if (!Number.isFinite(number)) continue;
    agents.push({ number, name: match[2].trim(), role: match[3].trim() });
  }
  return agents;
}

function issueToMission(issue) {
  if (!issue) return null;
  const body = issue.body || '';
  const checks = [...body.matchAll(/- \[([ xX])\]\s+(.+)/g)].map((m) => ({
    done: m[1].toLowerCase() === 'x',
    text: m[2].trim()
  }));
  const done = checks.filter((x) => x.done).length;
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.html_url || issue.url,
    updatedAt: issue.updated_at || issue.updatedAt,
    createdAt: issue.created_at || issue.createdAt,
    body,
    labels: (issue.labels || []).map((label) => typeof label === 'string' ? label : label.name),
    checklist: checks,
    progress: checks.length ? Math.round((done / checks.length) * 100) : null
  };
}

function readFallback() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fallback.json'), 'utf8'));
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const fallback = readFallback();
  try {
    const base = 'https://api.github.com';
    const [
      allRepos,
      issueItems,
      pulls,
      events,
      commits,
      releases,
      agentMarkdown,
      liveDashboardRaw
    ] = await Promise.all([
      safeFetch(base + '/users/' + OWNER + '/repos?per_page=100&sort=updated&type=owner', null, []),
      safeFetch(base + '/repos/' + OWNER + '/' + PRIMARY + '/issues?state=all&per_page=100&sort=updated', null, []),
      safeFetch(base + '/repos/' + OWNER + '/' + PRIMARY + '/pulls?state=open&per_page=50&sort=updated', null, []),
      safeFetch(base + '/users/' + OWNER + '/events/public?per_page=30', null, []),
      safeFetch(base + '/repos/' + OWNER + '/' + PRIMARY + '/commits?per_page=20', null, []),
      safeFetch(base + '/repos/' + OWNER + '/' + PRIMARY + '/releases?per_page=10', null, []),
      safeFetch('https://raw.githubusercontent.com/' + OWNER + '/' + PRIMARY + '/' + LIVE_BRANCH + '/docs/agentes/README.md', 'application/vnd.github.raw+json', ''),
      safeFetch('https://raw.githubusercontent.com/' + OWNER + '/' + PRIMARY + '/' + LIVE_BRANCH + '/' + LIVE_DASHBOARD_PATH, 'application/vnd.github.raw+json', null)
    ]);

    const repos = allRepos
      .filter((repo) => REPO_ALLOWLIST.includes(repo.name))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage,
        defaultBranch: repo.default_branch,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        updatedAt: repo.updated_at,
        visibility: repo.visibility,
        archived: repo.archived,
        ownerAvatar: repo.owner && repo.owner.avatar_url
      }));

    const issues = issueItems
      .filter((item) => !item.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url || issue.url,
        state: issue.state,
        createdAt: issue.created_at || issue.createdAt,
        updatedAt: issue.updated_at || issue.updatedAt,
        comments: issue.comments,
        labels: (issue.labels || []).map((label) => typeof label === 'string' ? label : label.name),
        body: issue.body || ''
      }));

    const prData = pulls.map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      draft: pr.draft,
      state: pr.state,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      head: pr.head && pr.head.ref,
      base: pr.base && pr.base.ref,
      author: pr.user && pr.user.login
    }));

    const publicEvents = events.map((event) => ({
      id: event.id,
      type: event.type,
      repo: event.repo && event.repo.name,
      createdAt: event.created_at,
      actor: event.actor && event.actor.login,
      payload: {
        action: event.payload && event.payload.action,
        ref: event.payload && event.payload.ref,
        refType: event.payload && event.payload.ref_type,
        issueNumber: event.payload && event.payload.issue && event.payload.issue.number,
        issueTitle: event.payload && event.payload.issue && event.payload.issue.title,
        pullNumber: event.payload && event.payload.pull_request && event.payload.pull_request.number,
        pullTitle: event.payload && event.payload.pull_request && event.payload.pull_request.title
      }
    }));

    const commitData = commits.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      url: commit.html_url,
      message: commit.commit && commit.commit.message,
      date: commit.commit && commit.commit.author && commit.commit.author.date,
      author: (commit.author && commit.author.login) || (commit.commit && commit.commit.author && commit.commit.author.name)
    }));

    const releaseData = releases.map((release) => ({
      id: release.id,
      tag: release.tag_name,
      name: release.name,
      url: release.html_url,
      publishedAt: release.published_at,
      prerelease: release.prerelease,
      draft: release.draft
    }));

    const agents = parseAgents(agentMarkdown);

    let missionLive = null;
    if (liveDashboardRaw) {
      try { missionLive = JSON.parse(liveDashboardRaw); } catch {}
    }

    const requestedMission = Number(req.query && req.query.mission);
    const liveIssueMatch = missionLive && missionLive.links && missionLive.links.issue
      ? String(missionLive.links.issue).match(/\/issues\/(\d+)/)
      : null;
    const liveIssueNumber = liveIssueMatch ? Number(liveIssueMatch[1]) : null;
    const preferredMissionNumber = Number.isFinite(requestedMission) && requestedMission > 0
      ? requestedMission
      : liveIssueNumber;

    const missionCandidate =
      (preferredMissionNumber ? issues.find((issue) => issue.number === preferredMissionNumber) : null) ||
      issues
        .filter((issue) => /^MCF-|\bmission\b/i.test(issue.title))
        .sort((a, b) => b.number - a.number)[0] ||
      issues[0] ||
      null;

    const primaryRepo = repos.find((repo) => repo.name === PRIMARY) || null;
    const avatar = primaryRepo && primaryRepo.ownerAvatar;

    const payload = {
      generatedAt: new Date().toISOString(),
      source: 'GitHub public data + stable raw mission feed',
      cacheSeconds: 600,
      user: {
        login: OWNER,
        avatar,
        publicReposObserved: allRepos.length
      },
      primaryRepo,
      repos,
      issues,
      pulls: prData,
      events: publicEvents,
      commits: commitData,
      releases: releaseData,
      agents,
      mission: issueToMission(missionCandidate) || missionFromLive(missionLive),
      missionLive,
      localIntegrations: {
        voiceHub: {
          scope: 'local-only',
          cloudConnected: false,
          status: 'Não observável diretamente pela Vercel sem bridge local autenticado.'
        },
        linux: {
          scope: 'local-only',
          cloudConnected: false,
          status: 'O cockpit público não lê o desktop Linux diretamente.'
        },
        augusto: {
          scope: 'local-only',
          cloudConnected: false,
          status: 'Reporter local registrado no MCF; estado ao vivo exige bridge local.'
        }
      },
      deployment: {
        environment: process.env.VERCEL_ENV || 'local',
        url: process.env.VERCEL_URL || null,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null
      }
    };

    res.status(200).json(payload);
  } catch (error) {
    if (fallback) {
      res.setHeader('X-MCF-Data-Mode', 'fallback-snapshot');
      res.status(200).json({
        ...fallback,
        generatedAt: fallback.generatedAt,
        servedAt: new Date().toISOString(),
        source: 'Build snapshot fallback — GitHub public data',
        warning: 'Live GitHub API unavailable; serving last verified public snapshot.'
      });
      return;
    }

    res.status(503).json({
      error: 'github_data_unavailable',
      message: error.message,
      generatedAt: new Date().toISOString()
    });
  }
};