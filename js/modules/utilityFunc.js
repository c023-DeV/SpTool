export function nodeFromOptions(container) {
    let parent;
    if (typeof container === 'string') {
        parent = document.querySelector(container);
    }
    else if (container instanceof HTMLElement) {
        parent = container;
    }
    if (!parent) {
        throw new Error('Container not found');
    }
    return parent;
}

export function lerp(a, b, t) { return a + (b - a) * t; }

//setup an octave array relative to root
export function genOctaveRef(oct, newRoot) {

  // oct = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
  // newRoot = "C";
  // return = ["C","C#","D",...]

  const i = oct.indexOf(newRoot);
  if (i === -1) {console.error("Could not remap Reference Octave!"); return [...oct];}
  return oct.slice(i).concat(oct.slice(0, i));
}

//Create an array containing only the notes of the selected scale so we can reference them
export function genScaleRef(scale, refOctave) {

  // refOctave = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#","A", "A#", "B"];
  // scale = [2,2,1,2,2,2,1];
  // returns = ["C","D","E","F","G","A";"B"];

  if (scale.reduce((s, v) => s + v, 0) !== 12) {
    throw new Error("Scale must sum to 12 semitones");
  }
  const scaleRef = [];
  let pos = 0;
  for (let step of scale) {
    scaleRef.push(refOctave[pos]);
    pos += step;
  }
  return scaleRef;
}

export function getNoteValue(refOctave,intervals,curNote) {
  //Get Note Value Relative to Selected Scale & Degree
  const i = refOctave.indexOf(curNote);
  return i === -1 ? "nD" : intervals[i];
}


/**
 * Shifts content of an array to the left by 1
 * @param {*} arr 
 * @returns 
 */
export function shiftArray(arr, index) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const n = arr.length;
  const i = ((index % n) + n) % n; // normalize
  return arr.slice(i).concat(arr.slice(0, i));
}