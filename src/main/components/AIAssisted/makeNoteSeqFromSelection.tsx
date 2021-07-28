import RootStore from "../../stores/RootStore";



export const makeNoteSeq = (rootStore: RootStore, check_range = false) => {
  const { assistStore, arrangeViewStore } = rootStore

  // Fetch selected notes
  const quantPerQuarter = assistStore.con.quantPerQuarter
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
