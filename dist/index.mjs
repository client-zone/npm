/**
 * Takes any input and guarantees an array back.
 *
 * - Converts array-like objects (e.g. `arguments`, `Set`) to a real array.
 * - Converts `undefined` to an empty array.
 * - Converts any another other, singular value (including `null`, objects and iterables other than `Set`) into an array containing that value.
 * - Ignores input which is already an array.
 *
 * @module array-back
 * @example
 * > const arrayify = require('array-back')
 *
 * > arrayify(undefined)
 * []
 *
 * > arrayify(null)
 * [ null ]
 *
 * > arrayify(0)
 * [ 0 ]
 *
 * > arrayify([ 1, 2 ])
 * [ 1, 2 ]
 *
 * > arrayify(new Set([ 1, 2 ]))
 * [ 1, 2 ]
 *
 * > function f(){ return arrayify(arguments); }
 * > f(1,2,3)
 * [ 1, 2, 3 ]
 */

function isObject (input) {
  return typeof input === 'object' && input !== null
}

function isArrayLike (input) {
  return isObject(input) && typeof input.length === 'number'
}

/**
 * @param {*} - The input value to convert to an array
 * @returns {Array}
 * @alias module:array-back
 */
function arrayify (input) {
  if (Array.isArray(input)) {
    return input
  } else if (input === undefined) {
    return []
  } else if (isArrayLike(input) || input instanceof Set) {
    return Array.from(input)
  } else {
    return [input]
  }
}

class ApiClientBase {
  /**
   * @param [options] {object}
   * @param [options.baseUrl] {string} - The base URL for all subsequent paths passed into `fetch()`.
   * @param [options.fetchOptions] {object}
   * @param [options.console] {object}
   */
  constructor (options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.fetchOptions = options.fetchOptions || {};
    this.console = options.console || {};
    this.console.log ||= function () {};
    this.console.info ||= function () {};
    this.console.warn ||= function () {};
    this.console.error ||= function () {};
    this.console.table ||= function () {};
  }

  async #createNotOKError (url, fetchOptions, response) {
    const err = new Error(`${response.status}: ${response.statusText}`);
    err.request = { url, fetchOptions };
    err.response = {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
      headers: response.headers
    };
    return err
  }

  /**
   * Called just before the fetch is made. Override to modify the fetchOptions. Used by clients which set bespoke security headers.
   */
  preFetch (url, fetchOptions) {}

  /**
   * @param [options] {object}
   * @param [options.skipPreFetch] {boolean}
   * @param [options.fetchOptions] {object} - The default fetch options for each request. E.g. for passing in a custom dispatcher.
   * @returns {Response}
   */
  async fetch (path, options = {}) {
    const fetchOptions = Object.assign({}, this.fetchOptions, options);

    // TODO: rewrite to use URL instances? They have built-in methods like searchParams.add(). Handle URL instances as input as an alternative to `path`? See ibkr-cpapi for a use case study.
    // TODO: Add retrying
    const url = `${this.baseUrl}${path}`;
    if (!options.skipPreFetch) {
      this.preFetch(url, fetchOptions);
    }

    const now = Date.now();
    let response;
    try {
      this.console.info('Fetching', url, fetchOptions);
      /* Potential fetch exceptions: https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions */
      response = await fetch(url, fetchOptions);
    } catch (err) {
      const baseError = new Error(`Failed to fetch: ${url}`);
      baseError.cause = err;
      baseError.request = { url, fetchOptions };
      throw baseError
    }

    this.console.info(`Fetched: ${url}, Response: ${response.status}, Duration: ${Date.now() - now}ms`);
    return response
  }

  async fetchJson (path, options) {
    const response = await this.fetch(path, options);
    if (response.ok) {
      return response.json()
    } else {
      const err = await this.#createNotOKError(path, options, response);
      throw err
    }
  }

  async fetchText (path, options) {
    const response = await this.fetch(path, options);
    if (response.ok) {
      return response.text()
    } else {
      const err = await this.#createNotOKError(path, options, response);
      throw err
    }
  }

  async graphql (url, query, variables) {
    const json = await this.fetchJson(url, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
      headers: { 'content-type': 'application/json' }
    });
    if (json.errors) {
      const err = new Error('graphql request failed');
      err.responseBody = json;
      throw err
    } else {
      return json
    }
  }
}

class Queue {
  commands = []
  stats = {
    total: 0,
    complete: 0,
    active: 0
  }

  constructor (options = {}) {
    this.maxConcurrency = options.maxConcurrency || 1;
  }

  add (command, ...args) {
    this.commands.push({ command, args });
    this.stats.total++;
  }

  /**
   * Iterate over `commands` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  /* TODO: yield { command, event: 'start' } or similar, rather than only yielding on completion or emitting a "start" event. Is this async yielding of start/end events possible like it is with events? */
  /* TODO: Real-life updating of slotsAvailable if new commands are added while processing is in progress */
  async * [Symbol.asyncIterator] () {
    while (this.commands.length) {
      const slotsAvailable = Math.min(this.maxConcurrency - this.stats.active, this.commands.length);
      if (slotsAvailable > 0) {
        const toRun = [];
        for (let i = 0; i < slotsAvailable; i++) {
          let { command, args } = this.commands.shift();
          if (!Array.isArray(args)) {
            args = [args];
          }
          let executable;
          if (typeof command === 'function') {
            executable = command;
          } else if (typeof command === 'object' && typeof command.execute === 'function') {
            executable = command.execute.bind(command);
          } else {
            throw new Error('Command structure not recognised')
          }
          /* Execute the command */
          this.stats.active++;
          const commandPromise = executable(...args).then(result => {
            this.stats.active -= 1;
            this.stats.complete += 1;
            return result
          });
          toRun.push(commandPromise);
        }
        const completedCommands = await Promise.all(toRun);
        for (const command of completedCommands) {
          yield command;
        }
      }
    }
  }

  /**
  Returns an array containing the results of each node in the queue.
  */
  async process () {
    const output = [];
    for await (const result of this) {
      output.push(result);
    }
    return output
  }
}

/**
 * @module @client-zone/npm
 */


/**
 * An isomorphic API client to access npm download and registry data.
 *
 * @typicalname npm
 * @alias module:@client-zone/npm
 */
class NpmApi extends ApiClientBase {

  /**
   * @param {string[]} - One or more package names
   * @param [point] {string} - One of the point values described in the [docs](https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values).
   * @see https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values
   */
  async getTotalPackageDownloads (packageNames, point = 'last-month') {
    packageNames = arrayify(packageNames);
    const url = `https://api.npmjs.org/downloads/point/${point}`;

    const result = {
      packages: [],
      total: 0
    };

    const queue = new Queue();

    /* non-scoped names */
    const nonScopedNames = packageNames.filter(name => !/@/.test(name));
    if (nonScopedNames.length === 1) {
      queue.add(async () => {
        const data = await this.fetchJson(`${url}/${nonScopedNames[0]}`);
        result.packages.push({ name: nonScopedNames[0], downloads: data.downloads });
      });
    } else {
      while (nonScopedNames.length) {
        const names = nonScopedNames.splice(0, 128);
        queue.add(async () => {
          /* bulk query */
          const data = await this.fetchJson(`${url}/${names.join(',')}`);
          for (const prop of Object.keys(data)) {
            result.packages.push({
              name: prop,
              downloads: data[prop] ? data[prop].downloads : 0
            });
          }
        });
      }
    }

    /* scoped names, bulk queries not supported */
    const scopedNames = packageNames.filter(name => /@/.test(name));
    for (const packageName of scopedNames) {
      queue.add(async () => {
        try {
          const json = await this.fetchJson(`${url}/${packageName}`);
          result.packages.push({ name: packageName, downloads: json.downloads });
        } catch (err) {
          if (err.response.status === 404) {
            result.packages.push({ name: packageName, downloads: 0 });
          } else {
            throw err
          }
        }
      });
    }

    await queue.process();

    const statsQueue = new Queue();
    statsQueue.add(async function () {
      result.total = result.packages
        .map(p => p.downloads)
        .reduce((total, curr) => (total += curr), 0);
      return result
    });

    await statsQueue.process();
    return result
  }

  /**
   * Returns daily download totals for a package over a given time period.
   *
   * @param {string} - npm package name
   * @param [options] {object}
   * @param [options.period] {string} - One of the point values specified [here](https://github.com/npm/registry/blob/main/docs/download-counts.md#parameters) (e.g. `last-day`, `last-week` etc). Either specify `options.period` or `options.from` (and optionally `options.to`) but not both.
   * @param [options.from] {string|Date} - Time period start date.
   * @param [options.to] {string|Date} - Time period end date. If `from` is specified but `to` is not, `to` defaults to today's date.
   * @see https://github.com/npm/registry/blob/main/docs/download-counts.md
   */
  async getPackageDownloadHistory (packageName, options = {}) {
    /*
    TODO: Implement rate limit retries. Use retryable-fetch. Requesting too often (e.g. https://api.npmjs.org/downloads/range/2026-01-01:2026-06-30/renamer) triggers this error message:

    Error 1015 Ray ID: 9d626d466fa8ec22 • 2026-03-02 18:22:26 UTC
    You are being rate limited. What happened? The owner of this website (api.npmjs.org) has banned you temporarily from accessing this website. Please see https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1015/ for more details.

    Fetch in 18 month periods. One year appears to work:
    https://api.npmjs.org/downloads/range/2025-01-01:2025-12-31/renamer

    But two years doesn't, the first half of 2024 is missing:
    https://api.npmjs.org/downloads/range/2024-01-01:2025-12-31/renamer

    Range each request from Jan to June the following year, then July to Dec the following year:
    https://api.npmjs.org/downloads/range/2023-01-01:2024-06-30/renamer
    https://api.npmjs.org/downloads/range/2024-07-01:2025-12-31/renamer
     */
    const results = [];
    if (options.from) {
      const dateFormat = new Intl.DateTimeFormat('en-ca'); // e.g. 2024-09-13
      options.to ||= new Date();
      if (options.from instanceof Date) options.from = dateFormat.format(options.from);
      if (options.to instanceof Date) options.to = dateFormat.format(options.to);
      const url = `https://api.npmjs.org/downloads/range/${options.from}:${options.to}/${packageName}`;
      results.push(await this.fetchJson(url));
    } else if (options.period) {
      const url = `https://api.npmjs.org/downloads/range/${options.period}/${packageName}`;
      results.push(await this.fetchJson(url));
    } else {
      /* Fetch everything - should only be necessary the first time. After then, use `options.since`. */
      const ranges = [
        '2015-01-01:2016-06-30',
        '2016-07-01:2017-12-31',
        '2018-01-01:2019-06-30',
        '2019-07-01:2020-12-31',
        '2021-01-01:2022-06-30',
        '2022-07-01:2023-12-31',
        '2024-01-01:2025-06-30',
        '2025-07-01:2026-12-31',
      ];
      const queue = new Queue({ maxConcurrency: 1 }); // low concurrency to avoid rate limits
      for (const range of ranges) {
        const url = `https://api.npmjs.org/downloads/range/${range}/${packageName}`;
        queue.add(async () => this.fetchJson(url));
      }
      const processed = await queue.process();
      results.push(...processed);
    }
    const output = [];
    for (const json of results) {
      output.push(...json.downloads);
    }

    return output.map(i => ({ date: i.day, total: i.downloads }))
  }

    /**
   * [Docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage). [Response data](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md).
   *
   * @param {string} - package name
   * @param [options] {object}
   * @param [options.latest] {boolean} - Include only the latest version, not all versions
   * @param [options.abbreviated] {boolean} - Include only the install data. Doesn't appear to work with `latest`.
   */
  async getPackage (packageName, options = {}) {
    const fetchOptions = {
      mode: 'cors',
      headers: {}
    };
    if (options.abbreviated) {
      fetchOptions.headers.accept = 'application/vnd.npm.install-v1+json';
    }
    return this.fetchJson(`https://registry.npmjs.org/${packageName}${options.latest ? '/latest' : ''}`, fetchOptions)
  }

  /**
   * Maintainer searches now appear to exclude deprecated packages by default. There is no way to actively search for deprecated packages.
   *
   * Special search qualifiers can be provided in the full-text query:
   *
   *     author:bcoe: Show/filter results in which bcoe is the author
   *     maintainer:bcoe: Show/filter results in which bcoe is qualifier as a maintainer
   *     scope:foo: Show/filter results published under the @foo scope
   *     keywords:batman: Show/filter results that have batman in the keywords
   *         separating multiple keywords with
   *             , acts like a logical OR
   *             + acts like a logical AND
   *             ,- can be used to exclude keywords
   *     not:unstable: Exclude packages whose version is < 1.0.0
   *     not:insecure: Exclude packages that are insecure or have vulnerable dependencies (based on the nsp registry)
   *     is:unstable: Show/filter packages whose version is < 1.0.0
   *     is:insecure: Show/filter packages that are insecure or have vulnerable dependencies (based on the nsp registry)
   *     boost-exact:false: Do not boost exact matches, defaults to true
   *
   * @param [options] {object}
   * @param [options.size] {number} - Max 250
   * @param [options.text] {string} - Full-text search string
   * @example
   * npm.search({ text: `maintainer:75lb` })
   * npm.search({ text: `author:75lb`, size: 10 })
   * @See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   */
  async search (options = {}) {
    options.size ||= 250;
    const url = new URL('https://registry.npmjs.org/-/v1/search');
    for (const key of Object.keys(options)) {
      url.searchParams.set(key, options[key]);
    }
    const data = await this.fetchJson(url);
    let finished = !(data.total > data.objects.length);
    while (!finished) {
      url.searchParams.set('from', data.objects.length);
      const moreData = await this.fetchJson(url);
      data.objects.push(...moreData.objects);
      finished = !(data.total > data.objects.length);
    }
    return data.objects.map(o => o.package)
  }
}

export { NpmApi as default };
