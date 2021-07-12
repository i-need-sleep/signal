import * as mm from '@magenta/music/es6'
import { Button } from "@material-ui/core"
import { FC } from "react"
import styled from "styled-components"
import { localized } from "../../../../common/localize/localizedString"
import { createNote } from "../../../actions"
import { useStores } from "../../../hooks/useStores"


const StyledButton = styled(Button)`
  min-width: auto;
  padding: 0 0.7rem;
  border: 1px solid var(--divider-color);
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
`

export const TestButton: FC = () => {
  const rootStore = useStores()
  const music_rnn = new mm.MusicRNN(
    "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn"
  );
  music_rnn.initialize()

// Test Click function
  function test_on_click() {
    let quantPerQuarter = rootStore.assistStore.con.quantPerQuarter
    let rnn_steps = 16
    let rnn_temperatre = rootStore.assistStore.con.rnn_temperature
    // To create notes
    createNote(rootStore)(480, 60, 480, true) 
    
    // Fetch select notes
    const selectedEventIdsObj = rootStore.arrangeViewStore.selectedEventIds
    
    if (Object.values(selectedEventIdsObj).length != 1){
      return
    }

    const eventIds = Object.values(selectedEventIdsObj)[0]

    if (eventIds.length == 0){
      return
    }

    
    let timebase = rootStore.song.timebase
    let quantizedStepLength = Math.floor(timebase/quantPerQuarter)
    let notes = []
    let lastQuantStep = 0
    let firstQuantStep = -1

    for (let i=0; i<eventIds.length; i++){
      let noteEvent = rootStore.song.tracks[rootStore.song.selectedTrackId].getEventById(eventIds[i])
      if (noteEvent && noteEvent.type == "channel" && noteEvent.subtype == "note"){
        let start = Math.floor(noteEvent.tick/quantizedStepLength)
        let end = Math.floor((noteEvent.tick + noteEvent.duration)/quantizedStepLength)
        let pitch = noteEvent.noteNumber
        if (start == end || pitch < 48 || pitch > 82){
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

    console.log(noteSeq)

    music_rnn
    .continueSequence(noteSeq, rnn_steps, rnn_temperatre)
    .then((cont_out: any) => write_rnn_notes(cont_out.notes)
    )
    
    function write_rnn_notes (notes: any){
      console.log(notes)
    }

    rootStore.arrangeViewStore.selection = {height: 1, width: 480, x:480, y:1}
  }

  
  return (
    <StyledButton
      onClick={() => test_on_click()}
    >
      {localized("Test", "Test")}
    </StyledButton>
  )
}
