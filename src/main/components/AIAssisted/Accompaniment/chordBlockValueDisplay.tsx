import { FC } from "react"
import { useStores } from "../../../hooks/useStores"


export const ChordBlockValueDisplay: FC = () => {
  
  const { arrangeViewStore, assistStore } = useStores()
  const blocks = arrangeViewStore.chordBlocks
  const blockRects = arrangeViewStore.chordBlockRects
  const { scrollLeft, scrollTop } = arrangeViewStore

  let out = []

  // Hide when zoomed out
  if ( arrangeViewStore.scaleX < 0.32 ){return (<div></div>)}

  for (let i=0; i < blocks.length; i++){
    let x = 0
    let y = 0
    let ArrangeCanvas = document.getElementById("ArrangeCanvas")
    if (ArrangeCanvas != null){
      x = blockRects[i].x + ArrangeCanvas.getBoundingClientRect().left + assistStore.blockstyle.left - scrollLeft
      if (x < ArrangeCanvas.getBoundingClientRect().left){continue}
      y = blockRects[i].y + blockRects[i].height + assistStore.blockstyle.top - scrollTop
    }
    out.push(
      <div style = {{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: "none"
        
      }}>
        {blocks[i].chd_string}
        </div>
    )
  }
  


  return (
    <div >
      {out}
    </div>
  )
}
