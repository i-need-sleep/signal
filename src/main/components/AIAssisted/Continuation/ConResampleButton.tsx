import { FC } from "react"
import { useStores } from "../../../hooks/useStores"
import { ConConfirm, ConGenerate } from "./ConGen"


export const ConResampleButton: FC = () => {
  const rootStore = useStores()
  let x = 0
  let y = 0
  let ArrangeCanvas = document.getElementById("ArrangeCanvas")
  if (rootStore.arrangeViewStore.selectionRect_con && ArrangeCanvas != null && rootStore.assistStore.con.display_buttons){
    x = rootStore.arrangeViewStore.selectionRect_con.x + rootStore.arrangeViewStore.selectionRect_con.width + ArrangeCanvas.getBoundingClientRect().left
    y = rootStore.arrangeViewStore.selectionRect_con.y
  }

  
  return (
    <div hidden={!rootStore.assistStore.con.display_buttons}
    style = {{
      position: 'absolute',
      left: x,
      top: y,
    }}>
      <button onClick={function(){ConGenerate(rootStore)}} >Resample</button>
      <button onClick={function(){rootStore.assistStore.active="selection"; ConConfirm(rootStore)}} >Confirm</button>
    </div>
  )
}
