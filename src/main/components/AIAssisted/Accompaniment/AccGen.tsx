import { AccompanimentTrack } from "../../../../common/track";
import { createNote } from "../../../actions";
import RootStore from "../../../stores/RootStore";
import { accPrepData } from "./AccPrepData";
import { setTrackVolume } from "../../../actions";
const axios = require('axios').default;

export const accGenerate = (rootStore: RootStore, filter:number[]=[]) => {
  const { assistStore, arrangeViewStore, song } = rootStore
  const timebase = song.timebase
  const tracks = song.tracks
  let acc_track_idx = -1

  // Prep the data for the Accomotage API
  let request_data = accPrepData(rootStore, filter)

  if (request_data == "invalid" || request_data == undefined){
    return
  }

  // Look for the index of the accompaniment track
  // Add an accompaniment if there isn't one
  for ( let i=0; i<tracks.length; i++){
    if (tracks[i].special_track == "accompaniment"){
      acc_track_idx = i
    }
  }
  
  if (acc_track_idx == -1){
    song.addTrack(AccompanimentTrack(tracks.length-1))
    acc_track_idx = tracks.length - 1
    
    // Set the volumn to 30
    setTrackVolume(rootStore)(acc_track_idx, 30)
  }

  if (!assistStore.acc.posting){
    assistStore.acc.posting = true
    axios.post('http://127.0.0.1:5000/arrangement', request_data)
    .then(function (response: any) {
      assistStore.acc.posting = false
      let acc_notes = response.data.notes
      
      // Clean up the notes in the selected selection in the acc track
      let track_events = rootStore.song.tracks[acc_track_idx].events
      for (let i=0; i<track_events.length; i++){
        let track_event = track_events[i]
        if (track_event.type == "channel"){
          if (track_event.subtype == "note"){
            let start = track_event.tick
            let end = track_event.tick + track_event.duration
            if (rootStore.arrangeViewStore.selection != null){
              let selection_start = rootStore.arrangeViewStore.selection.x
              let selection_end = rootStore.arrangeViewStore.selection.x + rootStore.arrangeViewStore.selection.width
              if ((start > selection_start && start < selection_end) || (end > selection_start && end < selection_end)){
                tracks[acc_track_idx].removeEvent(track_event.id)
              }
            }
          }
        }
      }

      // Write notes into the accompaniment track
      for (let i=0; i < acc_notes.length; i++){
        let acc_note = acc_notes[i]
        let pitch = acc_note.pitch
        let duration = (acc_note.end - acc_note.start) * timebase * 2

        if (rootStore.arrangeViewStore.selection == null){return}
        let selection_start = rootStore.arrangeViewStore.selection.x
        if (selection_start < 0){
          selection_start = 0
        }

        let start = timebase * acc_note.start * 2 + selection_start

        createNote(rootStore)(start, parseInt(pitch), duration, true, acc_track_idx)
      }
    })
    .catch(function (error: any) {
      assistStore.acc.posting = false
      console.log(error)
    })
  }

}