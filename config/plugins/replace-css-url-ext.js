'use strict'

const { RawSource } = require('webpack-sources')

const isCSS = (name) => /\.css$/.test(name)

class ReplaceCssUrlExt {
  constructor(options) {
    this.options = options || {}
  }

  replaceExt(compilation, chunks, callback) {
    const assets = compilation.assets

    chunks.forEach((chunk) => {
      const input = chunk.files.filter(isCSS)

      for (let name of input) {
        const asset = assets[name]
        let source = asset.source()

        // const { rule } = this.options;
        const rule = /\.(png|jpe?g)\)/ig
        if (rule.test(source)) {
          source = source.replace(rule, '.webp)')
          assets[name] = new RawSource(source)
        }
      }
    })

    callback()
  }

  apply(compiler) {
    const plugin = {
      name: 'ReplaceCssUrlExt',
    }

    compiler.hooks.compilation.tap(plugin, compilation => {
      compilation.hooks.optimizeChunkAssets.tapAsync(plugin, (chunks, cb) => {
        this.replaceExt(compilation, chunks, cb)
      })
    })
  }
}

module.exports = ReplaceCssUrlExt
