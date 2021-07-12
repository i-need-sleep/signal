import { FC } from "react"
import { useStores } from "../../../hooks/useStores"


export const SegBlockValueDisplay: FC = () => {
  
  const { arrangeViewStore, assistStore } = useStores()
  const blocks = arrangeViewStore.segmentBlocks
  const blockRects = arrangeViewStore.segmentBlockRects

  let out = []

  for (let i=0; i < blocks.length; i++){
    let x = 0
    let y = 0
    let ArrangeCanvas = document.getElementById("ArrangeCanvas")
    if (ArrangeCanvas != null){
      x = blockRects[i].x + ArrangeCanvas.getBoundingClientRect().left + assistStore.blockstyle.left
      y = blockRects[i].y + blockRects[i].height + assistStore.blockstyle.top
    }
    out.push(
      <div style = {{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: "none"
        
      }}>
        {blocks[i].value}
        </div>
    )
  }
  
  return (
    <div >
      {out}
    </div>
  )
}
