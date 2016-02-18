"use strict"

const _ = require("lodash")
const shortid = require("shortid")
const express = require("express")
const serveStatic = require("serve-static")
const bodyParser = require("body-parser")
const falcorRouter = require("falcor-router")
const falcorExpress = require("falcor-express")
const fs = require("fs")
const path = require("path")

const app = express()

app.use(serveStatic("../client"))

app.use(bodyParser.urlencoded({extended: false}))

app.use("/falcorception.json", falcorExpress.dataSourceRoute(function () {
  return new falcorRouter([
    {
      route: "meta.napis",
      get: () => ({path: ["meta", "napis"], value: 2001})
    },
    {
      route: "apis[{integers:indices}][{keys:props}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.indices)
          .zipObject(pathSet.indices)
          .mapValues(_.propertyOf(data.apis))
          .tap(console.log)
          .mapValues(_.propertyOf(data.apisById))
          .tap(console.log)
          .flatMap((api, index) => _.map(pathSet.props, prop => ({path: ["apis", index, prop], value: api[prop]})))
          .value()
      }
    },
    {
      route: "apisById[{keys:ids}][{keys:props}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.ids)
          .map(_.propertyOf(data.apisById))
          .flatMap(api => _.map(pathSet.props, prop => ({path: ["apisById", api.id, prop], value: api[prop]})))
          .value()
      },
    },
    {
      route: "apis.create",
      call(callPath, args) {
        const name = args[0]
        const id = shortid.generate()
        // fs.writeFileSync(path.join(__dirname, id + ".json"), JSON.stringify())
        const newLength = rw(function (model) {
          model.apisById[id] = {id, name, routes: []}
          return model.apis.push(id)
        })
        return {
          paths: [["apis", [newLength - 1, "length"]]],
          jsonGraph: {
            apis: {
              [newLength - 1]: {$type: "ref", value: ["apisById", id]},
              length: newLength
            },
          },
        }
      },
    },
  ])
}))

app.listen(9009)

function rw(mutator) {
  const dataPath = path.join(__dirname, "data.json")
  const data = JSON.parse(fs.readFileSync(dataPath))
  const result = mutator ? mutator(data) : data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
  return result
}
