import RootStore from "../../../stores/RootStore";
import { makeNoteSeq } from "../makeNoteSeqFromSelection";
import { makeMatFromChord } from "../makeMatFromChord";



export const accPrepData = (rootStore: RootStore, filter: any) => {
  const { assistStore, arrangeViewStore } = rootStore
  
  let noteSeq: any = {notes:[]}
  noteSeq = makeNoteSeq(rootStore) // {notes:[{quantizedStartStep, quantizedEndStep, pitch}]}
  let chdBlocks = arrangeViewStore.chordBlocks 
  let segBlocks = arrangeViewStore.segmentBlocks
  
  let note_out = [] // [{start, end, pitch}]
  let chd_out: any[] = [] // [notes]

  // Final outputs
  let note_mat: any[] =  [] // (T * 130) quantized at 16th note. 130 = 128 pitches + sustain + rest
  let chd_mat: any[] =  [] // (T * 36) quantized at 16th note [root (absolute) chroma(absolute) bass(relative)] in one-hot
  let seg_out = '' // eg."A4B4A4\n"]

  if (arrangeViewStore.selection == null){return}
  let selection_start = arrangeViewStore.selection.x
  let width = arrangeViewStore.selection.width
  if (selection_start < 0){
    width += selection_start
    selection_start = 0
  }
  const selection_end = width + selection_start
  const timebase = rootStore.song.timebase
  const quantPerQuarter = assistStore.con.quantPerQuarter

  // Sort blocks by time
  const sorter = function(a: any, b: any) {
    var keyA = a.x,
      keyB = b.x;
    if (keyA < keyB) return -1
    if (keyA > keyB) return 1
    return 0
  }
  segBlocks.sort(sorter)

  // Make segmentations
  let seg_starts: any[] = []
  let seg_names: string[] = []
  let total_length = 0
  for (let i=0; i<segBlocks.length; i++){
    let block = segBlocks[i]
    if (block.x >= selection_end){break}
    if (block.x >= selection_start){
      seg_starts.push([block.value, block.x / timebase / 4])
    }
  }
  seg_starts.push(['', selection_end / timebase / 4])
  for (let i=0; i<seg_starts.length-1; i++){
    let seg_start = seg_starts[i]
    let len = seg_starts[i+1][1] - seg_start[1]
    let name = ''
    if (seg_names.includes(seg_start[0])){
      name = String.fromCharCode(65+seg_names.indexOf(seg_start[0]))
    }
    else {
      seg_names.push(seg_start[0])
      name = String.fromCharCode(64+seg_names.length)
    }
    seg_out += name + len.toString()
    total_length += len
    if (![4, 6, 8].includes(len)){
      return "invalid"
    }
  }
  seg_out += "\n"

  if (segBlocks.length == 0){
    return "invalid"
  }
  
  // Make chord sequence
  let chd_seq: any[] = []
  for (let i=0; i<chdBlocks.length; i++){
    let block = chdBlocks[i]
    if (block.x >= selection_end){break}
    if (block.x + block.width > selection_start){
      let start = block.x / timebase
      if (block.x < selection_start){
        start = selection_start / timebase
      }
      let end
      if (i == chdBlocks.length-1 || chdBlocks[i+1].x >= selection_end){
        end = selection_end / timebase
      }
      else{
        end = chdBlocks[i+1].x/timebase
      }
      chd_seq.push([block.chd_mat, (start - selection_start/timebase)/2, (end - selection_start/timebase)/2])
    }
  }
  
  // Translate chord sequence into note sequence
  for (let i=0; i < chd_seq.length; i++){
    chd_mat = chd_mat.concat(makeMatFromChord(chd_seq[i]))
  }

  
  // Translate noteSeq into note mat
  for (let i=0; i<noteSeq.notes.length; i++){
    let note = noteSeq.notes[i]
    note_out.push({start: note.quantizedStartStep/quantPerQuarter, end: note.quantizedEndStep/quantPerQuarter, pitch: note.pitch})
  }

  for (let i=0; i<total_length*16; i++){
    let note
    
    while (note_out.length > 0 && note_out[0].end <= i / 4){
      note_out.shift()
    }
    if (note_out.length > 0){
      note = note_out[0]
    }
    else{
      let zeros = new Array(130).fill(0)
      zeros[129] = 1
      note_mat.push(zeros)
      continue
    }
    if (note.start == i/4){
      let zeros = new Array(130).fill(0)
      zeros[note.pitch] = 1
      note_mat.push(zeros)
      continue
    }
    if (note.start > i/4){
      // rest
      let zeros = new Array(130).fill(0)
      zeros[129] = 1
      note_mat.push(zeros)
      continue
    }
    // sustain
    let zeros = new Array(130).fill(0)
    zeros[128] = 1
    note_mat.push(zeros)
  }

  return {melody: note_mat, chords: chd_mat, segments: seg_out, filter: filter}
}