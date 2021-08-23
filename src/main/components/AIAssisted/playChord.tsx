import { Button } from "@material-ui/core"
import { Chord } from "@tonaljs/tonal"
import { isNumber } from "lodash"
import { FC } from "react"
import styled from "styled-components"
import { localized } from "../../../common/localize/localizedString"
import { useStores } from "../../hooks/useStores"
import { makeNoteSeq } from "./makeNoteSeqFromSelection"
import * as mm from '@magenta/music/es6';

var chd_player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus')

function get_prog(chord: any){ 
  const prog_step_duration = 1
  const octave_center = 48;
  
  let notes = []

  let root = chord.slice(0,12).indexOf(1)
  let chroma = chord.slice(12,24)
  let bass = chord.slice(24,36).indexOf(1)

  notes.push({pitch: octave_center + root + bass -12, startTime: 0, endTime: prog_step_duration})

  for (let i=0; i<chroma.length; i++){
    if (chroma[i] == 1){
      notes.push({pitch: octave_center + i, startTime: 0, endTime: prog_step_duration})
    }
  }

  let out = new mm.NoteSequence
  out.notes = notes
  out.totalTime = prog_step_duration

  return out
  
}

export const playChord = (chd_mat: any) => {
  let prog = get_prog(chd_mat)
  if (prog == undefined){
    return
  }
  if (chd_player.isPlaying()){
    chd_player.stop()
  }
  chd_player.start(prog)
  return
}
