
export const makeMatFromChord = (chord: any) => {
  let stage = 4 * 12
  let mat = chord[0]
  let root = mat[0]
  let inner = mat[1]
  let outers = mat[2]
  let bass = mat[3]

  let root_mat = new Array(12).fill(0)
  let chroma_mat = new Array(12).fill(0)
  let bass_mat = new Array(12).fill(0)

  // Translate inner and outer into relative pitches
  const m3 = [3,7]
  const d3 = [3,6]
  const a3 = [4,8]
  const M3 = [4,7]
  const M7 = [4,7,11]
  const m7 = [3,7,10]
  const Mm7 = [4,7,10]
  const mM7 = [3,7,11]
  const d7 = [3,6,9]
  const hd7 = [3,6,10]
  let inner_translate = [m3, d3, a3, M3, M7, m7, Mm7, mM7, d7, hd7]
  let outer_translate = [2,5,9,1,3,6,8]

  // Add root and bass(relative)
  root_mat[root] = 1
  bass_mat[(12 + bass - root)%12] = 1

  // Add inner
  let inner_chms = inner_translate[inner]
  for (let i=0; i<inner_chms.length; i++){
    chroma_mat[(inner_chms[i] + root) % 12] = 1
  }
  chroma_mat[root] = 1

  // Add outer
  for (let i=0; i<outers.length; i++){
    let outer = outers[i]
    if (outer == 10){
      chroma_mat[(7 + root) % 12] = 0
    }
    if ([7,8,9].includes(outer)){
      chroma_mat[(4 + root) % 12] = 0
      chroma_mat[(3 + root) % 12] = 0
    }
    if (outer == 8){
      chroma_mat[(5 + root) % 12] = 1
    }
    if (outer == 7){
      chroma_mat[(2 + root) % 12] = 1
    }
    if (outer < 7){
      chroma_mat[(outer_translate[outer] + root) % 12] = 1
    }
  }

  // Piece the three parts together
  let out: any = [...root_mat, ...chroma_mat, ...bass_mat]

  // Duplicate to reflect the duration
  let duration = (chord[2] - chord[1]) * 8
  out = Array(duration).fill(out)
  
  return out
}
