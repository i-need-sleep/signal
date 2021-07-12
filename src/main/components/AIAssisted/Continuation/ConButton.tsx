import { makeStyles } from "@material-ui/core"
import Popover from '@material-ui/core/Popover'
import Typography from '@material-ui/core/Typography'
import { ArrowDropDown, Create } from "@material-ui/icons"
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab"
import { observer } from "mobx-react-lite"
import { useCallback, useState } from "react"
import styled from "styled-components"
import { useStores } from "../../../hooks/useStores"
import SelectIcon from "../../../images/select.svg"
import { ConConfirm, ConGenerate } from "./ConGen"
import { ConTempSlider } from "./ConTempSlider"

const useStyles = makeStyles((theme) => ({
  toggleButtonGroup: {
    backgroundColor: "transparent",
    marginRight: "1rem",
  },
  typography: {
    padding: theme.spacing(2),
  },
}))

const SelectionToolIcon = styled(SelectIcon)`
  width: 1rem;
  fill: currentColor;
`

export const StyledToggleButton = styled(ToggleButton)`
  height: 2rem;
  color: var(--text-color);
  font-size: 1rem;
  padding: 0 0.7rem;
  &.Mui-selected {
    background: var(--theme-color);
  }
  text-transform: none;
`

export const ConButton = observer(() => {
  const { assistStore, arrangeViewStore, song } = useStores()
  const rootStore = useStores()
  const active = assistStore.active

  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  const onClickCon = useCallback(
    () => (assistStore.active = "continuation"),
    []
  )
  const onClickPencil = useCallback(
    () => (assistStore.active = "pencil"),
    []
  )
  const onClickSelection = useCallback(
    () => (assistStore.active = "selection"),
    []
  )

  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null);
  };

  const classes = useStyles()
  return (
    <ToggleButtonGroup value={active} className={classes.toggleButtonGroup}>
      <StyledToggleButton 
          onClick={function(e) {
              if (assistStore.active != "continuation"){
                // Draw a 1-bar box for continuation

                if (Object.values(arrangeViewStore.selectedEventIds).length != 1){
                  return
                }
                const eventIds = Object.values(arrangeViewStore.selectedEventIds)[0]
                if (eventIds.length == 0){
                  return
                }
                if (arrangeViewStore.selection == null){
                  return
                }
                let box_start = arrangeViewStore.selection.x +  arrangeViewStore.selection.width
                let box_y = arrangeViewStore.selection.y
                arrangeViewStore.selection_con = {x: box_start, y:box_y, width: song.timebase * 4, height: 1}
                ConGenerate(rootStore)
                onClickCon()
              }
          }} 
          value="continuation">

        Continuation
        <ArrowDropDown 
        onClick={function(e) {
          setAnchorEl(e.currentTarget)
        }} />
        <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >

        <Typography className={classes.typography}>Temperature</Typography>
        <ConTempSlider/>

      </Popover>
      </StyledToggleButton>
      <StyledToggleButton onClick={onClickPencil} value="pencil">
        <Create
          style={{
            width: "1rem",
          }}
        />
      </StyledToggleButton>
      <StyledToggleButton onClick={function (e){
          onClickSelection()
          ConConfirm(rootStore)
      }} 
      value="selection">
        <SelectionToolIcon viewBox="0 0 24 24" />
      </StyledToggleButton>
    </ToggleButtonGroup>
  )
})
