import RootStore from "../../stores/RootStore";



export const makeNoteSeq = (rootStore: RootStore, check_range = false, track_idx=-1) => {
  const { assistStore, arrangeViewStore } = rootStore
  const quantPerQuarter = assistStore.con.quantPerQuarter

  // If a track id is specified
  if (track_idx > -1){
    if (rootStore.arrangeViewStore.selection == null){return}
    let x = rootStore.arrangeViewStore.selection.x
    let width = rootStore.arrangeViewStore.selection.width
    let track = rootStore.song.tracks[track_idx]
    
    // Make a noteseq
    let timebase = rootStore.song.timebase
    let quantizedStepLength = Math.floor(timebase/quantPerQuarter)
    let notes = []
    let lastQuantStep = 0
    let firstQuantStep = -1

    for (let i=0; i<track.events.length; i++){
      let noteEvent = track.events[i]
      if (noteEvent && noteEvent.type == "channel" && noteEvent.subtype == "note"){
        if (noteEvent.tick < x || noteEvent.tick+noteEvent.duration > x+width){continue}
        let start = Math.floor(noteEvent.tick/quantizedStepLength)
        let end = Math.floor((noteEvent.tick + noteEvent.duration)/quantizedStepLength)
        let pitch = noteEvent.noteNumber
        if (start == end || ((pitch < 48 || pitch > 82) && check_range)){
          continue
        }
        if (end > lastQuantStep){
          lastQuantStep = end
        }
        if (firstQuantStep == -1){
          firstQuantStep = start
        }
        notes.push({
          quantizedStartStep: start - firstQuantStep,
          quantizedEndStep: end - firstQuantStep,
          pitch: pitch
        })
      }
    }
    
    let noteSeq = {notes: notes, quantizationInfo: {stepsPerQuarter: quantPerQuarter}, totalQuantizedSteps: lastQuantStep - firstQuantStep}

    return noteSeq
  }

  // Fetch selected notes
  const selectedEventIdsObj = rootStore.arrangeViewStore.selectedEventIds

  if (Object.values(selectedEventIdsObj).length != 1){
    return
  }

  const eventIds = Object.values(selectedEventIdsObj)[0]

  if (eventIds.length == 0){
    return
  }

  // Make a noteseq
  let timebase = rootStore.song.timebase
  let quantizedStepLength = Math.floor(timebase/quantPerQuarter)
  let notes = []
  let lastQuantStep = 0
  let firstQuantStep = -1

  for (let i=0; i<eventIds.length; i++){
    rootStore.song.selectedTrackId = Number(Object.keys(selectedEventIdsObj)[0])
    let noteEvent = rootStore.song.tracks[rootStore.song.selectedTrackId].getEventById(eventIds[i])
    if (noteEvent && noteEvent.type == "channel" && noteEvent.subtype == "note"){
      let start = Math.floor(noteEvent.tick/quantizedStepLength)
      let end = Math.floor((noteEvent.tick + noteEvent.duration)/quantizedStepLength)
      let pitch = noteEvent.noteNumber
      if (start == end || ((pitch < 48 || pitch > 82) && check_range)){
        continue
      }
      if (end > lastQuantStep){
        lastQuantStep = end
      }
      if (firstQuantStep == -1){
        firstQuantStep = start
      }
      notes.push({
        quantizedStartStep: start - firstQuantStep,
        quantizedEndStep: end - firstQuantStep,
        pitch: pitch
      })
    }
  }

  let noteSeq = {notes: notes, quantizationInfo: {stepsPerQuarter: quantPerQuarter}, totalQuantizedSteps: lastQuantStep - firstQuantStep}

  return noteSeq
}
