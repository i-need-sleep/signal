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
import { accGenerate } from "../Accompaniment/AccGen"
import { ConConfirm, ConGenerate } from "./ConGen"
import { ConTempSlider } from "./ConTempSlider"
import { AccFilterSelect } from "../Accompaniment/AccFilterSelect"

const axios = require('axios').default;

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

  // Load accomontage references
  if (assistStore.acc.refs.length == 0){
    axios.get('http://127.0.0.1:5000/arrangement_refs')
      .then(function (response: any) {
        assistStore.acc.refs = response.data.names
      })
      .catch(function (error: any) {
        console.log(error)
      })
  }


  const onClickCon = useCallback(
    () => (assistStore.active = "continuation"),
    []
  )
  const onClickArr = useCallback(
    () => {
      // assistStore.active = "arrangement"
    },
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

  // Continuation dropdown
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  const open = Boolean(anchorEl)

  const handleClose = (e:any) => {
    e.stopPropagation()
    setAnchorEl(null);
  };

  // Accompaniment dropdown
  const [anchorEl_acc, setAnchorEl_acc] = useState<Element | null>(null)

  const open_acc = Boolean(anchorEl_acc)

  const handleClose_acc = (e:any) => {
    e.stopPropagation()
    setAnchorEl_acc(null);
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
          e.stopPropagation()
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
        PaperProps={{
          style: {
          overflow: 'hidden'},
        }}
        onClick={(e)=>{e.stopPropagation()}}
      >

        <Typography className={classes.typography}>Temperature: 
        {" "+rootStore.assistStore.con.rnn_temperature}</Typography>
        <ConTempSlider/>

      </Popover>
      </StyledToggleButton>
      <StyledToggleButton onClick={() => {
        onClickArr()
        accGenerate(rootStore)
      }} value="arrangement">
        Accompaniment
        <ArrowDropDown 
        onClick={function(e) {
          e.stopPropagation()
          setAnchorEl_acc(e.currentTarget)
        }} />
        <Popover
        open={open_acc}
        anchorEl={anchorEl_acc}
        onClose={handleClose_acc}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
          overflow: 'hidden'},
        }}
      >
      <AccFilterSelect set={setAnchorEl_acc} rootStore={rootStore}/>
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
