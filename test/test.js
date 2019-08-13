import path from "path"

import webpack from "webpack"
import pify from "pify"
import {CleanWebpackPlugin} from "clean-webpack-plugin"
import ms from "ms.macro"
import fsp from "@absolunet/fsp"
import {last} from "lodash"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require
const {default: SitemapXmlWebpackPlugin} = indexModule

jest.setTimeout(ms`1 minute`)

const getWepbackConfig = name => ({
  mode: "production",
  context: path.join(__dirname, name),
  entry: path.join(__dirname, name),
  output: {
    path: path.join(__dirname, "..", "dist", "test", name),
  },
})

it("should run", async () => {
  const name = "basic"
  const webpackConfig = {
    ...getWepbackConfig(name),
    plugins: [
      new CleanWebpackPlugin,
      new SitemapXmlWebpackPlugin("example.com"),
    ],
  }
  await pify(webpack)(webpackConfig)
  const xml = await fsp.readXml(path.join(__dirname, "..", "dist", "test", name, "sitemap.xml"))
  expect(xml.urlset.$.xmlns).toMatch("sitemaps.org/")
  expect(xml.urlset.url[0]).toMatchObject({
    loc: ["https://example.com/"],
    changefreq: ["daily"],
  })
})

it("should run with custom urls", async () => {
  const name = "customUrls"
  const webpackConfig = {
    ...getWepbackConfig(name),
    plugins: [
      new CleanWebpackPlugin,
      new SitemapXmlWebpackPlugin({
        domain: "example.com",
        paths: ["c", "a", "a/b"],
      }),
    ],
  }
  await pify(webpack)(webpackConfig)
  const xml = await fsp.readXml(path.join(__dirname, "..", "dist", "test", name, "sitemap.xml"))
  expect(xml.urlset.url.length).toBe(4)
  expect(last(xml.urlset.url).loc[0]).toBe("https://example.com/c")
})