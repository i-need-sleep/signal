import { AccompanimentTrack, AccompanimentRefTrack } from "../../../../common/track";
import { createNote } from "../../../actions";
import RootStore from "../../../stores/RootStore";
import { accPrepData } from "./AccPrepData";
import { setTrackVolume, toggleMuteTrack } from "../../../actions";
const axios = require('axios').default;

export const accGenerate = (rootStore: RootStore, filter:number[]=[], spotlight='', from_ref=false) => {
  rootStore.assistStore.loading = true
  const { assistStore, arrangeViewStore, song } = rootStore
  const timebase = song.timebase
  const tracks = song.tracks
  let acc_track_idx = -1
  let acc_ref_track_idx = -1

  // Prep the data for the Accomotage API
  let request_data = accPrepData(rootStore, filter, spotlight, from_ref)

  if (request_data == "invalid" || request_data == undefined){
    rootStore.assistStore.loading = false
    return
  }

  // Look for the index of the accompaniment / accompaniment_reference track
  // Add an accompaniment if there isn't one
  for ( let i=0; i<tracks.length; i++){
    if (tracks[i].special_track == "accompaniment"){
      acc_track_idx = i
    }
    if (tracks[i].special_track == "accompaniment_ref"){
      acc_ref_track_idx = i
      rootStore.assistStore.acc.ref_idx = i
    }
  }
  
  if (acc_track_idx == -1){
    song.addTrack(AccompanimentTrack(tracks.length-1))
    acc_track_idx = tracks.length - 1
    
    // Set the volumn to 30
    setTrackVolume(rootStore)(acc_track_idx, 30)
  }
  
  if (acc_ref_track_idx == -1){
    song.addTrack(AccompanimentRefTrack(song.tracks.length-1))
    acc_ref_track_idx = tracks.length - 1
    rootStore.assistStore.acc.ref_idx = tracks.length - 1

    // Mute the ref track
    toggleMuteTrack(rootStore)(acc_ref_track_idx)
  }


  if (!assistStore.acc.posting){
    assistStore.acc.posting = true
    let post_path = 'http://127.0.0.1:5000/arrangement'
    if (from_ref){
      post_path = 'http://127.0.0.1:5000/arrangement_apply'
    }
    axios.post(post_path, request_data)
    .then(function (response: any) {
      assistStore.acc.posting = false
      let acc_notes = response.data.notes
      let ref_notes = response.data.ref_notes
      
      // Clean up the notes in the selected selection in the acc / acc_ref track
      function clean_notes(acc_track_idx: any){
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
      }
      clean_notes(acc_track_idx)
      clean_notes(acc_ref_track_idx)
      

      // Write notes into the acc / acc_ref track
      function write_notes(acc_track_idx: any, acc_notes: any, scale: any){
        for (let i=0; i < acc_notes.length; i++){
          let acc_note = acc_notes[i]
          let pitch = acc_note.pitch
          let duration = (acc_note.end - acc_note.start) * timebase * scale
  
          if (rootStore.arrangeViewStore.selection == null){
            rootStore.assistStore.loading = false
            return
          }
          let selection_start = rootStore.arrangeViewStore.selection.x
          if (selection_start < 0){
            selection_start = 0
          }
  
          let start = timebase * acc_note.start * scale + selection_start
  
          createNote(rootStore)(start, parseInt(pitch), duration, true, acc_track_idx)
        }
      }
      write_notes(acc_track_idx, acc_notes, 2)
      write_notes(acc_ref_track_idx, ref_notes, 0.25)
      
      rootStore.assistStore.loading = false
    })
    .catch(function (error: any) {
      assistStore.acc.posting = false
      console.log(error)
      rootStore.assistStore.loading = false
    })
  }

}