/** @module sitemap-xml-webpack-plugin */

import resolveAny from "resolve-any"
import sitemapBuilder from "sitemap"
import {ensureObject} from "magina"
import {sortBy,uniqBy} from "lodash"

const webpackId = "SitemapXmlWebpackPlugin"

/**
 * @typedef pluginOptions
 * @type {Object}
 * @prop {boolean} [productionOnly=true] If true, only applies changes and emits files in Webpack mode `production`.
 * @prop {string} [fileName=sitemap.xml]
 * @prop {string} domain
 * @prop {string} [protocol=https]
 * @prop {string[]} [paths=[]]
 * @prop {string} [changeFrequency=daily] One of: `hourly`, `daily`, `weekly`, `monthly`
 * @prop {boolean} [setLastMod=true]
 * @prop {boolean} [sortPaths=true]
 */

/**
 * @class
 */
export default class {

  /**
   * @constructor
   * @param {pluginOptions} [options] Plugin options
   */
  constructor(options) {
    const optionsObject = ensureObject(options, "domain")
    this.options = {
      productionOnly: true,
      fileName: "sitemap.xml",
      protocol: "https",
      paths: [],
      changeFrequency: "daily",
      setLastMod: true,
      sortPaths: true,
      ...optionsObject,
    }
  }

  apply(compiler) {
    if (!this.options.domain) {
      throw new Error(`Option domain is required for ${_PKG_TITLE}`)
    }
    if (this.options.productionOnly && compiler.options.mode !== "production") {
      return
    }
    const lastmodISO = new Date().toISOString()
    compiler.hooks.emit.tapPromise(webpackId, async compilation => {
      const paths = [
        "",
        ...await resolveAny(this.options.paths),
      ]
      const urls = paths
        |> #.map(path => {
          const entry = ensureObject(path, "url")
          if (!entry.lastmodISO && this.options.setLastMod) {
            entry.lastmodISO = lastmodISO
          }
          if (!entry.changefreq && this.options.changeFrequency) {
            entry.changefreq = this.options.changeFrequency
          }
          return entry
        })
        |> uniqBy(#, "url")
        |> sortBy(#, "url")
      const sitemap = sitemapBuilder.createSitemap({
        urls,
        cacheTime: 0,
        hostname: `${this.options.protocol}://${this.options.domain}`,
      })
      const fileContents = sitemap.toString()
      const fileName = await resolveAny(this.options.fileName)
      compilation.assets[fileName] = {
        source: () => fileContents,
        size: () => fileContents.length,
      }
    })
  }

}