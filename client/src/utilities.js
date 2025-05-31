import { useEffect, useState } from "react";
import { UserAuth } from "./permissions/UserAuth";
import { message } from "antd";

function formatParams(params) {
  return Object.keys(params)
    .map((key) => key + "=" + encodeURIComponent(params[key]))
    .join("&");
}

async function processResponse(res, type) {
  if (res === "TIMEOUT") {
    message.error("The server took too long to respond. Try again later");
    throw Error("request timeout");
  }

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
    throw output;
  }

  return output;
}

function fetchWithTimeout(endpoint, args, timeout = 10) {
  return Promise.race([
    fetch(endpoint, args),
    new Promise((resolve) => setTimeout(() => resolve("TIMEOUT"), timeout * 1000)),
  ]);
}

export function get(endpoint, params = {}) {
  const fullPath = endpoint + "?" + formatParams(params);
  return fetchWithTimeout(fullPath, {
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

/**
 * @deprecated Use UserAuth directly instead
 */
export function hasAccess(user, tourney, userRoles) {
  return new UserAuth(user).forTourney(tourney).hasAnyRole(userRoles);
}

// returns the tournament and the current stage indicated bythe page URL
export async function getStage(tourneyId) {
  const tourney = await get("/api/tournament", { tourney: tourneyId });
  if (!tourney.stages || tourney.stages.length === 0) return [tourney, {}];

  let curIndex;
  if (!location.hash.substring(1)) {
    curIndex = Math.max(0, tourney.stages.filter((s) => s.poolVisible).length - 1);
  } else {
    curIndex = parseInt(location.hash.substring(1)) || 0;
  }

  const current = tourney.stages[curIndex] || tourney.stages[0];

  return [tourney, { ...current, index: curIndex }];
}

// returns the tournament and the current stage indicated bythe page URL
export async function getStageWithVisibleStats(tourneyId) {
  const tourney = await get("/api/tournament", { tourney: tourneyId });
  if (!tourney.stages || tourney.stages.length === 0) return [tourney, {}];

  let curIndex;
  if (!location.hash.substring(1)) {
    curIndex = Math.max(0, tourney.stages.filter((s) => s.statsVisible).length - 1);
  } else {
    curIndex = parseInt(location.hash.substring(1)) || 0;
  }

  const current = tourney.stages[curIndex] || tourney.stages[0];

  return [tourney, { ...current, index: curIndex }];
}

export function prettifyTourney(tourney) {
  return `${tourney.replace("_", " ").toUpperCase()}`;
}

export function tokenizeTourney(tourney) {
  const [codeAndDivision, year] = tourney.split("_");
  const [code, division] = codeAndDivision.split("-");

  return { code, year: parseInt(year), division, codeAndDivision };
}

export function exportCSVFile({ header, body, fileName }) {
  if (!fileName.endsWith(".csv")) fileName = `${fileName}.csv`;

  return exportTextFile({
    content: `${header}\n${body}`,
    contentType: "text/csv",
    fileName,
  });
}

export function exportTextFile({ content, contentType = "text/csv", fileName, charset = "utf-8" }) {
  const dl = document.createElement("a");
  dl.href = `data:${contentType};chartset=${charset},${encodeURIComponent(content)}`;
  dl.target = "_blank";
  dl.download = fileName;
  dl.click();
}

/**
 * A wrapper for window.matchMedia with updates
 *
 * @param {string} query
 * @returns {?MediaQueryList}
 */
export function useMatchMedia(query) {
  const [result, setResult] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setResult(media);
    const onChange = (e) => setResult(e);
    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [query]);

  return result;
}
