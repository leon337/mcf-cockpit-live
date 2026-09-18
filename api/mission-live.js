const OWNER = 'leon337';
const REPO = 'multiagent-collaboration-framework';

const MISSION_FEEDS = {
  234: {
    branch: 'main',
    checklistPath: 'artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/CHECKLIST.md',
    livePath: 'artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/LIVE-DASHBOARD.json',
    issueUrl: 'https://github.com/leon337/multiagent-collaboration-framework/issues/234',
    title: 'MCF Harness V2 — 2.0.0'
  },
  238: {
    branch: 'hardening/mcf-harness-2.1-20260918',
    checklistPath: 'artifacts/phases/PHASE-03-MCF-HARNESS-2.1-HARDENING/CHECKLIST.md',
    livePath: 'artifacts/phases/PHASE-03-MCF-HARNESS-2.1-HARDENING/LIVE-DASHBOARD.json',
    issueUrl: 'https://github.com/leon337/multiagent-collaboration-framework/issues/238',
    title: 'MCF Harness V2.1 Hardening'
  },
  241: {
    branch: 'main',
    checklistPath: 'artifacts/phases/PHASE-04-MCF-HARNESS-GRAPH-ENGINE-2.2/CHECKLIST.md',
    livePath: 'artifacts/phases/PHASE-04-MCF-HARNESS-GRAPH-ENGINE-2.2/LIVE-DASHBOARD.json',
    issueUrl: 'https://github.com/leon337/multiagent-collaboration-framework/issues/241',
    title: 'MCF Harness Graph Engine 2.2'
  }
};

function rawUrl(branch, path, epochBucket) {
  return 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' +
    encodeURIComponent(branch).replaceAll('%2F', '/') + '/' + path +
    '?mcf_live=' + epochBucket;
}

async function textFetch(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'mcf-cockpit-live' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('raw fetch failed: ' + response.status);
  return response.text();
}

function parseChecklist(markdown) {
  const rows = [];
  const regex = /^\s*-\s*\[([ xX~\-])\]\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(String(markdown || '')))) {
    const mark = match[1];
    const state = /[xX]/.test(mark) ? 'done' : mark === '~' ? 'partial' : mark === '-' ? 'deferred' : 'pending';
    rows.push({
      done: state === 'done',
      state,
      text: match[2].trim()
    });
  }
  return rows;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=15');

  const requested = Number(req.query && req.query.mission);
  const missionNumber = Number.isFinite(requested) && MISSION_FEEDS[requested] ? requested : 241;
  const config = MISSION_FEEDS[missionNumber];
  const bucket = Math.floor(Date.now() / 15000);

  try {
    const [checklistRaw, liveRaw] = await Promise.all([
      textFetch(rawUrl(config.branch, config.checklistPath, bucket)),
      textFetch(rawUrl(config.branch, config.livePath, bucket))
    ]);
    const checklist = parseChecklist(checklistRaw);
    const done = checklist.filter((item) => item.done).length;
    const live = JSON.parse(liveRaw);

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      cacheSeconds: 15,
      mission: {
        number: missionNumber,
        title: config.title,
        url: config.issueUrl,
        checklist,
        progress: checklist.length ? Math.round((done / checklist.length) * 100) : 0,
        updatedAt: live.updated_at || null,
        state: live.status === 'ENTREGUE' ? 'closed' : 'open'
      },
      missionLive: live,
      source: 'raw GitHub mission feed',
      branch: config.branch
    });
  } catch (error) {
    res.status(503).json({
      error: 'mission_live_unavailable',
      message: error.message,
      generatedAt: new Date().toISOString()
    });
  }
};
