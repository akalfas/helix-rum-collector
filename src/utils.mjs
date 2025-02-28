/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
// Pass the current time to facilitate unit testing
import { isSpider } from './spiders.mjs';
import { bots } from './bots.mjs';

export function isValidCheckpoint(checkpoint) {
  const knowncheckpoints = [
    'loadresource',
    'cwv',
    'cwv2',
    'click',
    'top',
    'lazy',
    'viewmedia',
    'viewblock',
    'leave',
    'load',
    'enter',
    // 'pagesviewed',
    'error',
    'navigate',
    'utm',
    'reload',
    'back_forward',
    'lcp',
    'missingresource',
    'sidekick:shown',
    'sidekick:loaded',
    'experiment',
    'formsubmit',
    'sidekick:hidden',
    'sidekick:updated',
    'sidekick:previewed',
    'sidekick:envswitched',
    '404',
    'crosswalk:previewed',
    'crosswalk:published',
    'sidekick:editoropened',
    'sidekick:published',
    'convert',
    'audiences',
    'viewfooter',
    // 'datadesk',
    'sidekick:loggedin',
    'search',
    'unsupported',
    'genai:prompt:generate',
    'sidekick:info',
    'genai:prompt:generatedvariations',
    'genai:prompt:isadobeselected',
    'formviews',
    'formready',
    'sidekick:custom:preflight',
    'formabondoned',
    'noscript',
    'sidekick:paletteclosed',
    'sidekick:custom:asset-library',
    'formfieldchange',
    'formfieldfocus',
    'nullsearch',
    'sidekick:custom:library',
    'variant',
    'genai:prompt:iscustomselected',
    'genai:consent:agree',
    'genai:prompt:new',
    'formhttppostput',
    'genai:prompt:copy',
    'sidekick:custom:localize-2',
    'sidekick:context-menu:addRemoveProject',
    'sidekick:viewdocsource',
    'sidekick:context-menu:openViewDocSource',
    // 'rfq',
    'sidekick:unpublished',
    'sidekick:helpnext',
    // 'csperror',
    'library:blockviewed',
    'formvalidationerrors',
    'showconsent',
    'consent',
    'paid',
    'email',
    'genai:consent:cancel',
    'sidekick:deleted',
    'sidekick:custom:version-history',
    'sidekick:custom:ost',
    'genai:prompt:thumbsup',
    'sidekick:custom:localize-v2',
    'sidekick:viewhidden',
    'sidekick:helpdismissed',
    'sidekick:custom:tagger',
    'sidekick:custom:assist',
    'sidekick:helpoptedout',
    'sidekick:custom:send-to-caas',
    'sidekick:share',
    'sidekick:custom:generate-variations',
    'sidekick:projectadded',
    'library:opened',
    'signin',
    'genai:prompt:export',
    'sidekick:custom:accessibility-mode',
    'sidekick:custom:locales',
  ];
  return knowncheckpoints.indexOf(checkpoint) > -1;
}
export function maskTime(time, timePadding) {
  const msPerHour = 3600000;

  const baseHour = Math.floor(time / msPerHour) * msPerHour;

  let numPadding;
  if (typeof timePadding === 'string') {
    numPadding = Number(timePadding);
  } else {
    numPadding = timePadding;
  }

  if (typeof numPadding === 'number' && !Number.isNaN(numPadding)) {
    // Limit the padding to a day
    const padding = Math.min(numPadding, 24 * msPerHour);

    return baseHour + padding;
  } else {
    // If the padding is missing we use the current second to spread
    // the result a little bit. We drop the current minute and the
    // current milliseconds
    const numSeconds = Math.floor((time - baseHour) / 1000);
    const currentSecondAsMS = (numSeconds % 60) * 1000;

    return baseHour + currentSecondAsMS;
  }
}

/**
 * Mask the current time by truncating it to the current hour and
 * adding the padding provided.
 *
 * @param {number} timePadding the padding to be added.
 * @returns the masked time.
 */
export function getMaskedTime(timePadding) {
  return maskTime(Date.now(), timePadding);
}

/**
 * Extract the OS from the user agent string
 * @returns {Enumerator(':android', ':ios', ':ipados', '')} the OS
 */
function getMobileOS(userAgent) {
  if (userAgent.includes('android')) {
    return ':android';
  } else if (userAgent.includes('ipad')) {
    return ':ipados';
  } else if (userAgent.includes('like mac os')) {
    return ':ios';
  }
  return '';
}
/**
 * Extract the OS from the user agent string
 * @returns {Enumerator(':windows', ':mac', ':linux', '')} the OS
 */
function getDesktopOS(userAgent) {
  if (userAgent.includes('windows')) {
    return ':windows';
  } else if (userAgent.includes('mac os')) {
    return ':mac';
  } else if (userAgent.includes('linux')) {
    return ':linux';
  } else if (userAgent.includes('x11; cros')) {
    return ':chromeos';
  }
  return '';
}

/**
 * Determines the type of bot based on the user agent string. If no bot
 * type can be determined, the empty string is returned.
 * @param {string} userAgent the user agent string
 * @returns {Enumerator('', ':search', ':seo', ':social', ':ai', ':security')} the bot type
 */
function getBotType(userAgent) {
  const type = Object
    .entries(bots)
    .find(([, botList]) => (botList
      .map(({ regex }) => new RegExp(regex, 'i'))
      .find((re) => re.test(userAgent))));
  return type ? `:${type[0].toLowerCase()}` : '';
}

export function getMaskedUserAgent(headers) {
  if (!headers) {
    return 'undefined';
  }

  if (headers.get('CloudFront-Is-Desktop-Viewer') === 'true') {
    return 'desktop';
  } else if (headers.get('CloudFront-Is-Mobile-Viewer') === 'true') {
    return 'mobile';
  } else if (headers.get('CloudFront-Is-SmartTV-Viewer') === 'true') {
    return 'desktop';
  } else if (headers.get('CloudFront-Is-Tablet-Viewer') === 'true') {
    return 'mobile';
  }
  if (headers.get('x-newrelic-id')) {
    return 'bot:monitoring';
  }

  const userAgent = headers.get('user-agent');

  if (!userAgent) {
    return 'undefined';
  }
  const lcUA = userAgent.toLowerCase();

  if (lcUA.includes('mobile')
    || lcUA.includes('android')
    || lcUA.includes('opera mini')) {
    return `mobile${getMobileOS(lcUA)}`;
  }
  if (lcUA.includes('bot')
    || lcUA.includes('spider')
    || lcUA.includes('crawler')
    || lcUA.includes('ahc/')
    || lcUA.includes('node')
    || lcUA.includes('python')
    || lcUA.includes('probe')
    || lcUA.includes('axios')
    || lcUA.includes('curl')
    || lcUA.includes('synthetics')
    || lcUA.includes('+https://')
    || lcUA.includes('+http://')
    || isSpider(lcUA)) {
    return `bot${getBotType(lcUA)}`;
  }

  return `desktop${getDesktopOS(lcUA)}`;
}

export function cleanurl(url) {
  // if URL does not parse, return it as is
  try {
    const u = new URL(url);
    // potential PII
    u.search = '';
    u.username = '';
    u.password = '';
    u.hash = '';
    return u.toString();
  } catch (e) {
    return url;
  }
}

export function getForwardedHost(fhh) {
  const hosts = fhh.split(',');

  const match = hosts
    .map((h) => h.trim())
    .filter((h) => h.match(/.+-.+[.](adobeaemcloud|aemcloud|aem|hlx)[.](page|live|net)$/));

  if (match.length > 0) {
    return match[0];
  } else {
    return hosts[0].trim();
  }
}

export function extractAdobeRoutingInfo(value) {
  // value is a string with key value pairs, separated by a comma
  // extract program, environment and tier
  const routingInfo = value
    .split(',')
    .map((pair) => pair.trim())
    .filter((pair) => pair.includes('='))
    .map((pair) => pair.split('='))
    .reduce((acc, [key, val]) => {
      acc[key] = val;
      return acc;
    }, {});
  return `${routingInfo.tier}-p${routingInfo.program}-e${routingInfo.environment}.adobeaemcloud.net`;
}

export function getSubsystem(req) {
  if (req.headers.get('x-adobe-routing')) {
    return extractAdobeRoutingInfo(req.headers.get('x-adobe-routing'));
  } else if (req.headers.get('x-forwarded-host')) {
    return getForwardedHost(req.headers.get('x-forwarded-host'));
  } else if (req.headers.get('host')) {
    return req.headers.get('host');
  }
  return 'undefined';
}
