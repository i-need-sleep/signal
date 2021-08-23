import { FC } from "react"
import { useStores } from "../../../hooks/useStores"
import { accGenerate } from "./AccGen"


export const AccRefApplyButton: FC = () => {
  const rootStore = useStores()
  let x = 0
  let y = 0
  let ArrangeCanvas = document.getElementById("ArrangeCanvas")
  if (ArrangeCanvas != null && rootStore.assistStore.acc.ref_idx > -1){
    x = ArrangeCanvas.getBoundingClientRect().left - 50
    y = rootStore.assistStore.acc.ref_idx * 78 + ArrangeCanvas.getBoundingClientRect().top -39
  }

  
  return (
    <div hidden={rootStore.assistStore.acc.ref_idx <= -1}
    style = {{
      position: 'absolute',
      left: x,
      top: y,
    }}>
      <button onClick={()=>{accGenerate(rootStore, [], '', true)}}>Apply</button>
    </div>
  )
}
