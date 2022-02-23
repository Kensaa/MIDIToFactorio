const fs = require("fs");
const { writeMidi, parseMidi } = require("midi-file");
const factorio = require("./libs/factorio");
//5
const tickSpeed = 2; //ms

const maxLength = 150;

const midiFile = "midis/ShootingStar.mid";

const noteMap = {
  F3: 53,
  "F#3": 54,
  G3: 55,
  "G#3": 56,
  A3: 57,
  "A#3": 58,
  B3: 59,
  C4: 60,
  "C#4": 61,
  D4: 62,
  "D#4": 63,
  E4: 64,
  F4: 65,
  "F#4": 66,
  G4: 67,
  "G#4": 68,
  A4: 69,
  "A#4": 70,
  B4: 71,
  C5: 72,
  "C#5": 73,
  D5: 74,
  "D#5": 75,
  E5: 76,
  F5: 77,
  "F#5": 78,
  G5: 79,
  "G#5": 80,
  A5: 81,
  "A#5": 82,
  B5: 83,
  C6: 84,
  "C#6": 85,
  D6: 86,
  "D#6": 87,
  E6: 88,
  F6: 89,
  "F#6": 90,
  G6: 91,
  "G#6": 92,
  A6: 93,
  "A#6": 94,
  B6: 95,
  C7: 96,
  "C#7": 97,
  D7: 98,
  "D#7": 99,
  E7: 100,
};

const midi = parseMidi(fs.readFileSync(midiFile));

let objectIndex = 0;

let blueprint = {
  blueprint: {
    icons: [
      { signal: { type: "item", name: "programmable-speaker" }, index: 1 },
    ],
    entities: [],
    label: "label",
  },
};

function addToBlueprint(x, y, item, optionalParameter = {}) {
  blueprint.blueprint.entities.push({
    entity_number: objectIndex,
    name: item,
    position: { x, y },
    ...optionalParameter,
  });
  objectIndex++;
}

const midiTickToGameTick = (i) => Math.ceil(i / tickSpeed);

function getStringNote(note) {
  let minI = 0;
  let i = 0;
  for (let val of Object.values(noteMap)) {
    if (Math.abs(val - note) < Math.abs(Object.values(noteMap)[minI] - note))
      minI = i;
    i++;
  }
  return Object.keys(noteMap)[minI];
}
let song;
blueprint.blueprint.label = midiFile.split("/")[1].split(".")[0];
for (let track of midi.tracks) {
  if (track.filter((e) => e.type === "noteOn").length > 0) {
    song = track;
  }
}

song = song.filter((e) => e.type === "noteOff" || e.type === "noteOn");

//let song = midi.tracks[0];
/*song.shift();
song.shift();
song.pop();*/

song = song.slice(2, -1);
fs.writeFileSync("out/output.json", JSON.stringify({ midi }, null, 4));

let songLength = 0;
for (let e of song) {
  songLength += midiTickToGameTick(e.deltaTime);
}

let notes = [];
console.log("soung length : " + songLength);

let currentTime = tickSpeed;
for (let note of song) {
  currentTime += note.deltaTime;
  if (note.type === "noteOn") {
    notes.push({
      startTime: currentTime,
      endTime: null,
      noteNumber: note.noteNumber,
    });
  } else if (note.type === "noteOff") {
    if (
      notes.filter((e) => e.noteNumber == note.noteNumber && e.endTime == null)
        .length > 0
    ) {
      notes.find(
        (e) => e.noteNumber == note.noteNumber && e.endTime == null
      ).endTime = currentTime;
    }
  }
}
fs.writeFileSync("out/notes.json", JSON.stringify({ notes }, null, 4));

let convertedNotes = notes.map((e) => {
  e.startTime = midiTickToGameTick(e.startTime);
  e.endTime = e.endTime ? midiTickToGameTick(e.endTime) : e.startTime + 100;
  e.noteNumber = getStringNote(e.noteNumber);
  return e;
});

fs.writeFileSync(
  "out/convertedNotes.json",
  JSON.stringify({ convertedNotes }, null, 4)
);

console.log("number of notes : " + convertedNotes.length);

//convert to blueprint

//add speaker
let x = 0;
let y = 0;
for (let note of convertedNotes) {
  if (x > maxLength) {
    y += 10;
    x = 0;
  }
  addToBlueprint(x, y, "programmable-speaker", {
    //useless ------------------>
    parameters: {
      playback_volume: 1,
      playback_globally: false,
      allow_polyphony: false,
    },
    alert_parameters: {
      show_alert: false,
      show_on_map: true,
      alert_message: "",
    },
    //<-------------------
    control_behavior: {
      circuit_parameters: {
        signal_value_is_pitch: false,
        instrument_id: 3,
        note_id: Object.keys(noteMap).indexOf(note.noteNumber),
      },
      circuit_condition: {
        first_signal: {
          type: "item",
          name: "steel-chest",
        },
        constant: 0,
        comparator: ">",
      },
    },
    connections: {
      1: {
        red: [
          {
            entity_id: null,
          },
        ],
      },
    },
  });
  note.entity_number = x;

  x++;
}
x = 0;
y = 0
for (let note of convertedNotes) {
  addToBlueprint(x, y-1, "small-lamp", {
    control_behavior: {
      circuit_condition: {
        first_signal: {
          type: "item",
          name: "steel-chest",
        },
        constant: 0,
        comparator: ">",
      },
    },
    connections: {
      1: {
        red: [
          {
            entity_id: null,
          },
        ],
      },
    },
  });
  if (x > maxLength) {
    y += 10;
    x = 0;
  }
  x++;
}
x = 0;
y = 0
for (let note of convertedNotes) {
  if (x > maxLength) {
    y += 10;
    x = 0;
  }
  if (x % 7 === 0) {
    addToBlueprint(x, y+1, "medium-electric-pole");
  }

  x++;
}
const poleNumber = objectIndex - convertedNotes.length;

console.log("number of poles : " + poleNumber);

//add logic
x = 0;
y = 0
let inputIndexes = [];
for (let note of convertedNotes) {
  if (x > maxLength) {
    y += 10;
    x = 0;
  }
  addToBlueprint(x, y+3, "arithmetic-combinator", {
    control_behavior: {
      arithmetic_conditions: {
        first_signal: {
          type: "item",
          name: "wooden-chest",
        },
        second_signal: {
          type: "item",
          name: "iron-chest",
        },
        operation: "AND",
        output_signal: {
          type: "item",
          name: "steel-chest",
        },
      },
    },
    connections: {
      1: {
        //input
        red: [
          {
            entity_id: objectIndex + 1,
            circuit_id: 2,
          },
        ],
      },
      2: {
        //output
        red: [
          {
            entity_id: (y/10*maxLength)+x+(y/10),
          },
          {
            entity_id: convertedNotes.length + (y/10*maxLength)+x+(y/10),
          },
        ],
      },
    },
  });
  addToBlueprint(x, y+5, "decider-combinator", {
    control_behavior: {
      decider_conditions: {
        first_signal: {
          type: "item",
          name: "iron-plate",
        },
        constant: note.startTime, //to change
        comparator: "≥",
        output_signal: {
          type: "item",
          name: "wooden-chest",
        },
        copy_count_from_input: false,
      },
    },
    connections: {
      1: {
        //input
        red: [
          {
            entity_id: objectIndex + 1,
            circuit_id: 1,
          },
        ],
      },
      2: {
        //output
        red: [
          {
            entity_id: objectIndex - 1,
            circuit_id: 1,
          },
          {
            entity_id: objectIndex - 1,
            circuit_id: 1,
          },
        ],
      },
    },
  });

  addToBlueprint(x, y+7, "decider-combinator", {
    control_behavior: {
      decider_conditions: {
        first_signal: {
          type: "item",
          name: "iron-plate",
        },
        constant: note.endTime, //to change
        comparator: "≤",
        output_signal: {
          type: "item",
          name: "iron-chest",
        },
        copy_count_from_input: false,
      },
    },
    connections: {
      1: {
        //input
        red: [
          {
            entity_id: objectIndex - 1,
            circuit_id: 1,
          },
        ],
      },
      2: {
        //output
        red: [
          {
            entity_id: objectIndex - 1,
            circuit_id: 2,
          },
        ],
      },
    },
  });
  inputIndexes.push(objectIndex - 1);

  x++;
}

let i = 0;
for (let ind of inputIndexes) {
  if (i === inputIndexes.length - 1) continue;
  blueprint.blueprint.entities[ind].connections["1"].red.push({
    entity_id: inputIndexes[i + 1],
    circuit_id: 1,
  });
  blueprint.blueprint.entities[inputIndexes[i + 1]].connections["1"].red.push({
    entity_id: ind,
    circuit_id: 1,
  });
  i++;
}

x = 0;
y = 0;
for (let note of convertedNotes) {
  if (x > maxLength) {
    y += 10;
    x = 0;
  }
  if (x % 7 === 0) {
    addToBlueprint(x, y+8, "medium-electric-pole");
  }
  x++;
}

fs.writeFileSync("out/out.bp", factorio.encode(JSON.stringify(blueprint)));
