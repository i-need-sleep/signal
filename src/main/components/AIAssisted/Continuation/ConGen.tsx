import * as mm from '@magenta/music/es6';
import { createNote, removeEvent } from '../../../actions';
import { makeNoteSeq } from '../makeNoteSeqFromSelection';
import mapValues from "lodash/mapValues"
import {
  fromPoints as rectFromPoints,
  IPoint,
  IRect
} from "../../../../common/geometry"
import Track, { isNoteEvent, NoteEvent } from "../../../../common/track"
import RootStore from "../../../stores/RootStore"


const music_rnn = new mm.MusicRNN(
  "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn"
);
music_rnn.initialize()

export const ConGenerate = (rootStore: RootStore) => {
  let quantPerQuarter = rootStore.assistStore.con.quantPerQuarter
  let rnn_temperatre = rootStore.assistStore.con.rnn_temperature

  // Delete temporary notes (generated from previous con runs) ...
  let temporary_ids = rootStore.assistStore.temp_notes
  for (let i=0; i<temporary_ids.length; i++){
    rootStore.song.selectedTrackId = Number(Object.keys(rootStore.arrangeViewStore.selectedEventIds)[0])
    removeEvent(rootStore)(temporary_ids[i])
  }
  rootStore.assistStore.temp_notes = []

  // ... And notes in the generation selection
  let track_events = rootStore.song.tracks[Number(Object.keys(rootStore.arrangeViewStore.selectedEventIds)[0])].events
  for (let i=0; i<track_events.length; i++){
    let track_event = track_events[i]
    if (track_event.type == "channel"){
      if (track_event.subtype == "note"){
        let start = track_event.tick
        let end = track_event.tick + track_event.duration
        if (rootStore.arrangeViewStore.selection_con != null){
          let selection_start = rootStore.arrangeViewStore.selection_con.x
          let selection_end = rootStore.arrangeViewStore.selection_con.x + rootStore.arrangeViewStore.selection_con.width
          if ((start > selection_start && start < selection_end) || (end > selection_start && end < selection_end)){
            removeEvent(rootStore)(track_event.id)
          }
        }
      }
    }
  }

  let noteSeq = makeNoteSeq(rootStore, true)
  const timebase = rootStore.song.timebase
  const selectedEventIdsObj = rootStore.arrangeViewStore.selectedEventIds

  if (rootStore.arrangeViewStore.selection_con == null || noteSeq == null){
    return
  }

  let gen_ticks = rootStore.arrangeViewStore.selection_con.width
  let gen_start_tick = rootStore.arrangeViewStore.selection_con.x

  // Display the resample and conformation buttons
  rootStore.assistStore.con.display_buttons = true

  // Run the RNN
  let rnn_step = Math.floor(gen_ticks/timebase*quantPerQuarter)
  if (rnn_step <= 0){return}
  music_rnn
  .continueSequence(noteSeq, rnn_step, rnn_temperatre)
  .then((cont_out: any) => write_rnn_notes(cont_out.notes)
  )

  // Write generated notes
  function write_rnn_notes (notes: any){
    for (let i=0; i < notes.length; i++){
      let pitch = notes[i].pitch
      if (rootStore.arrangeViewStore.selection_con == null){return}
      let start = notes[i].quantizedStartStep/quantPerQuarter*timebase + gen_start_tick
      let duration = (notes[i].quantizedEndStep-notes[i].quantizedStartStep)/quantPerQuarter*timebase
      rootStore.song.selectedTrackId = Number(Object.keys(selectedEventIdsObj)[0])
      let new_id = createNote(rootStore)(start, pitch, duration, true)
      if (new_id == undefined){continue}
      rootStore.assistStore.temp_notes.push(new_id)
    }
  }
  
}

function getNotesInSelection(tracks: Track[], selection: IRect) {
  const startTick = selection.x
  const endTick = selection.x + selection.width
  const ids: { [key: number]: number[] } = {}
  for (
    let trackIndex = selection.y;
    trackIndex < selection.y + selection.height;
    trackIndex++
  ) {
    const track = tracks[trackIndex]
    const events = track.events
      .filter(isNoteEvent)
      .filter((e) => e.tick >= startTick && e.tick <= endTick)
    ids[trackIndex] = events.map((e) => e.id)
  }
  return ids
}

export const ConConfirm = (rootStore: RootStore) => {
  rootStore.assistStore.temp_notes = []
  if (rootStore.arrangeViewStore.selection_con == null ||  rootStore.arrangeViewStore.selection == null){return}
  rootStore.arrangeViewStore.selection.width += rootStore.arrangeViewStore.selection_con.width
  const {
    song: { tracks }
  } = rootStore

    rootStore.arrangeViewStore.selectedEventIds = getNotesInSelection(tracks, rootStore.arrangeViewStore.selection)
  rootStore.arrangeViewStore.selection_con = null
  rootStore.assistStore.con.display_buttons = false
}