import { Button } from "@material-ui/core"
import { Chord } from "@tonaljs/tonal"
import { isNumber } from "lodash"
import { FC } from "react"
import styled from "styled-components"
import { localized } from "../../../common/localize/localizedString"
import { useStores } from "../../hooks/useStores"
import { makeNoteSeq } from "./makeNoteSeqFromSelection"


const StyledButton = styled(Button)`
  min-width: auto;
  padding: 0 0.7rem;
  border: 1px solid var(--divider-color);
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
`

export const AutoChordButton: FC = () => {
  const rootStore = useStores()
  const {assistStore, arrangeViewStore} = rootStore 
  const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const flat_pitches = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

  function auto_chord_on_click() {
    // Clean up all chords in the selected time span
    if (rootStore.arrangeViewStore.selection == null){return}
    let x_original = rootStore.arrangeViewStore.selection.x
    let end = rootStore.arrangeViewStore.selection.width + x_original
    let new_blocks = []
    let old_blocks = rootStore.arrangeViewStore.chordBlocks
    for (let i=0; i< old_blocks.length; i++){
      let block = old_blocks[i]
      if (block.x >= end || block.x+block.width <= x_original){
        new_blocks.push(block)
      }
    }
    rootStore.arrangeViewStore.chordBlocks = new_blocks


    // Fetch all selected notes as a sorted note list
    let note_seq : any = makeNoteSeq(rootStore)
    if (note_seq == undefined){return}
    note_seq = note_seq.notes
    const sorter = function(a: any, b: any) {
      var keyA = a.quantizedStartStep,
        keyB = b.quantizedStartStep;
      if (keyA < keyB) return -1
      if (keyA > keyB) return 1
      return 0
    }
    note_seq.sort(sorter)

    // Bin notes by time window (reslution = 2 quarter notes)
    // Translate notes to strings
    const window_size = assistStore.con.quantPerQuarter * 2
    let window_size_acc = 0
    let binned_notes:any[] = []
    for (let i=0; i<note_seq.length; i++){
      let start = note_seq[i].quantizedStartStep
      let pitch = note_seq[i].pitch
      while (start >= window_size_acc){
        binned_notes.push([])
        window_size_acc += window_size
      }
      if (!binned_notes[binned_notes.length-1].includes(pitch%12)){
        binned_notes[binned_notes.length-1].push(pitch%12)
      }
      
    }
    while (binned_notes.length > rootStore.arrangeViewStore.selection.width/(rootStore.song.timebase*2)){
      binned_notes.pop()
    }
    
    // Detech chords
    // For now, fit the first note into the C major scale
    let chords = []
    for (let i=0; i<binned_notes.length; i++){
      if (binned_notes[i].length == 0){
        chords.push([0,3,[],0])
      }
      
      let first_note = binned_notes[i][0]
      let idx = ['C','D','E','F','G','A','B'].indexOf(pitches[first_note])
      let root = pitches.indexOf(['C','D','E','F','G','A','B'][(idx+5)%7])
      if (root == -1){root = 0}
      // Translate chords symbols to chd_mats
      let inner = 0
      if ([0,5,7].includes(root)){
        inner = 3
      }
      if (root == 11){
        root = 7
        inner = 3
      }
      chords.push([root, inner, [], root])
    }

    // Add chord blocks
    for (let i=0; i<chords.length; i++){
      let chord = chords[i]
      if (typeof(chord[0]) != 'number' || typeof(chord[1]) != 'number'){return}
      let root:number = chord[0]
      let inner:number = chord[1]
      let new_block = {
        x: rootStore.song.timebase*2*i + x_original,
        width: rootStore.song.timebase*2,
        y: 2,
        height: 1,
        chd_string: pitches[root]+["min",'','','maj'][inner],
        chd_mat: chord,
        color: undefined
      }
      rootStore.arrangeViewStore.chordBlocks.push(new_block)
    }

    return
  }

  return (
    <StyledButton
      onClick={() => auto_chord_on_click()}
    >
      {localized("Auto Chord", "Auto Chord")}
    </StyledButton>
  )
}
