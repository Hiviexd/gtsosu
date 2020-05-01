function formatParams(params) {
  return Object.keys(params)
    .map((key) => key + "=" + encodeURIComponent(params[key]))
    .join("&");
}

async function processResponse(res, type) {
  const text = await res.text();
  let output = text;
  try {
    output = JSON.parse(output);
  } catch (err) {
    console.log(`Could not convert response to JSON: ${text}`);
  }

  if (!res.ok) {
    console.log(`Request failed with response status ${res.status}:`);
    console.log(output);
  }

  return output;
}

export function get(endpoint, params = {}) {
  const fullPath = endpoint + "?" + formatParams(params);
  return fetch(fullPath, {
    credentials: "include",
  }).then(processResponse);
}

export function post(endpoint, params = {}) {
  return fetch(endpoint, {
    method: "post",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(params),
  }).then(processResponse);
}

export function delet(endpoint, params = {}) {
  return fetch(endpoint, {
    method: "delete",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(params),
  }).then(processResponse);
}

export function hasAccess(user, tourney, roles) {
  return (
    user.username &&
    (user.admin || user.roles.some((r) => r.tourney === tourney && roles.includes(r.role)))
  );
}

// returns the tournament and the current stage indicated bythe page URL
export async function getStage(tourneyId) {
  const tourney = await get("/api/tournament", { tourney: tourneyId });
  if (!tourney.stages || tourney.stages.length === 0) return [tourney, {}];

  const curIndex = parseInt(location.hash.substring(1)) || 0; // parse stage from url
  const current = tourney.stages[curIndex] || tourney.stages[0];

  return [tourney, { ...current, index: curIndex }];
}
