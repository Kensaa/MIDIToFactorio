const factorio = require('./libs/factorio')
const fs = require('fs')

let input = fs.readFileSync('./inputJSON.json','utf8').trim()
let blueprint = factorio.encode(input)

fs.writeFileSync('out/stringOutput.txt',blueprint)
