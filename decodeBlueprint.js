const factorio = require('./libs/factorio')
const fs = require('fs')

let input = fs.readFileSync('./input','utf8').trim()
let blueprint = factorio.decode(input)

fs.writeFileSync('out/BlueprintOutput.json',JSON.stringify(blueprint,null,4))
