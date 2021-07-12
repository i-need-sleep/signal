import { chordTrack, conductorTrack, emptyTrack, segmentTrack } from "../track"
import Song from "./Song"

export function emptySong() {
  const song = new Song()
  song.addTrack(conductorTrack())
  song.addTrack(segmentTrack())
  song.addTrack(chordTrack())
  song.addTrack(emptyTrack(0))
  song.name = "new song"
  song.filepath = "new song.mid"
  song.selectedTrackId = 3
  return song
}
