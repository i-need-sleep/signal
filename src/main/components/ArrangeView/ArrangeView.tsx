import { Popover, TextField } from "@material-ui/core"
import useComponentSize from "@rehooks/component-size"
import Color from "color"
import { partition } from "lodash"
import cloneDeep from "lodash/cloneDeep"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import {
  containsPoint,
  IPoint,
  pointAdd,
  pointSub,
  zeroRect
} from "../../../common/geometry"
import {
  arrangeEndSelection,
  arrangeMoveSelection,
  arrangeResizeSelection,
  arrangeStartSelection,
  selectTrack,
  setPlayerPosition
} from "../../actions"
import { Layout } from "../../Constants"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useStores } from "../../hooks/useStores"
import { useTheme } from "../../hooks/useTheme"
import { ChordBlockValueDisplay } from "../AIAssisted/Arrangement/chordBlockValueDisplay"
import { ChordDial } from "../AIAssisted/Arrangement/chordDial"
import { SegBlockValueDisplay } from "../AIAssisted/Arrangement/segmentBlockValueDisplay"
import { ConGenerate } from "../AIAssisted/Continuation/ConGen"
import { ConResampleButton } from "../AIAssisted/Continuation/ConResampleButton"
import { GLCanvas } from "../GLCanvas/GLCanvas"
import { HorizontalScaleScrollBar } from "../inputs/ScaleScrollBar"
import { BAR_WIDTH, VerticalScrollBar } from "../inputs/ScrollBar"
import CanvasPianoRuler from "../PianoRoll/CanvasPianoRuler"
import { observeDrag } from "../PianoRoll/MouseHandler/observeDrag"
import { ArrangeContextMenu } from "./ArrangeContextMenu"
import { ArrangeViewRenderer } from "./ArrangeViewRenderer"

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
  background: var(--background-color);
  overflow: hidden;
`

const LeftTopSpace = styled.div`
  z-index: 999;
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid var(--divider-color);
  background: var(--background-color);
`

const LeftBottomSpace = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  background: var(--background-color);
`

const TrackHeader = styled.div`
  width: 8rem;
  padding: 0 0.5rem;
  box-sizing: border-box;
  display: flex;
  border-bottom: 1px solid var(--divider-color);
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HeaderList = styled.div`
  position: relative;
  border-right: 1px solid var(--divider-color);
`

export const ArrangeView: FC = observer(() => {
  const rootStore = useStores()

  const tracks = rootStore.song.tracks

  const { arrangeViewStore: s } = rootStore

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const {
    notes,
    cursorX,
    selection,
    selection_con,
    segmentBlocks,
    chordBlocks,
    mappedBeats,
    selectionRect,
    selectionRect_con,
    segmentBlockRects,
    chordBlockRects,
    trackHeight,
    contentWidth,
    transform,
    scrollLeft,
    scrollTop,
  } = rootStore.arrangeViewStore

  const setScrollLeft = useCallback(
    (v: number) => rootStore.arrangeViewStore.setScrollLeft(v),
    []
  )
  const setScrollTop = useCallback(
    (v: number) => rootStore.arrangeViewStore.setScrollTop(v),
    []
  )

  const containerWidth = size.width
  const contentHeight = trackHeight * tracks.length

  const theme = useTheme()

  useEffect(() => {
    rootStore.arrangeViewStore.canvasWidth = size.width
  }, [size.width])

  useEffect(() => {
    rootStore.arrangeViewStore.canvasHeight = size.height
  }, [size.height])

  const onClickScaleUp = useCallback(() => (s.scaleX += 0.1), [s])
  const onClickScaleDown = useCallback(
    () => (s.scaleX = Math.max(0.05, s.scaleX - 0.1)),
    [s]
  )
  const onClickScaleReset = useCallback(() => (s.scaleX = 1), [s])

  const onMouseMove = function (e:any){
    const { left, top } = e.currentTarget.getBoundingClientRect()

      function createPoint(e: MouseEvent) {
        const x = e.pageX - left + scrollLeft
        const y = e.pageY - top - Layout.rulerHeight + scrollTop
        const tick = transform.getTicks(x)
        return { x: tick, y: y / trackHeight }
      }

    const startPos = createPoint(e.nativeEvent)

    const isSelectionSelected =
      selection != null && containsPoint(selection, startPos)

    // Continuation box selection
    const isSelectionSelected_con =
      rootStore.arrangeViewStore.selection_con != null && containsPoint(rootStore.arrangeViewStore.selection_con, startPos)

    // Change cursor style when interactions are available
    if (isSelectionSelected && rootStore.assistStore.active == "selection"){
      document.body.style.cursor = "move"
    }
    else if (rootStore.assistStore.active == "selection"){
      document.body.style.cursor = "auto"
      for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
        
        if (containsPoint(rootStore.arrangeViewStore.segmentBlocks[i], startPos)){
          document.body.style.cursor = "move"
          let block = segmentBlocks[i]
          let temp_box_left = {x: block.x, y: block.y, width: rootStore.song.timebase, height: 1}
          let temp_box_right = {x: block.x + block.width - rootStore.song.timebase, y: block.y, width: rootStore.song.timebase, height: 1}
          if (containsPoint(temp_box_left, startPos) || containsPoint(temp_box_right, startPos)){
            document.body.style.cursor = "ew-resize"
          }
          break
        }
      }
      for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
        
        if (containsPoint(rootStore.arrangeViewStore.chordBlocks[i], startPos)){
          document.body.style.cursor = "move"
          let block = chordBlocks[i]
          let temp_box_left = {x: block.x, y: block.y, width: rootStore.song.timebase/3, height: 1}
          let temp_box_right = {x: block.x + block.width - rootStore.song.timebase/3, y: block.y, width: rootStore.song.timebase/3, height: 1}
          if (containsPoint(temp_box_left, startPos) || containsPoint(temp_box_right, startPos)){
            document.body.style.cursor = "ew-resize"
          }
          break
        }
      }
    }
    else if (isSelectionSelected_con){
      document.body.style.cursor = "ew-resize"
    }
    else {
      document.body.style.cursor = "auto"
    }
  }

  const handleLeftClick = useCallback(
    (e: React.MouseEvent, createPoint: (e: MouseEvent) => IPoint) => {
      const startPos = createPoint(e.nativeEvent)
      const isSelectionSelected =
        selection != null && containsPoint(selection, startPos)

      const isSelectionSelected_con =
      rootStore.arrangeViewStore.selection_con != null && containsPoint(rootStore.arrangeViewStore.selection_con, startPos)

      // Prepare for segBlock interactions
      let segBlockIdx = -1
      let original_width_seg = 0
      let original_x_seg = 0
      let seg_move_mode = "move"
      for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
        if (containsPoint(rootStore.arrangeViewStore.segmentBlocks[i], startPos)){
          let block = rootStore.arrangeViewStore.segmentBlocks[i]
          segBlockIdx = i
          original_width_seg = block.width
          original_x_seg = block.x
          let temp_box_left = {x: block.x, y: block.y, width: rootStore.song.timebase, height: 1}
          let temp_box_right = {x: block.x + block.width - rootStore.song.timebase, y: block.y, width: rootStore.song.timebase, height: 1}
          if (containsPoint(temp_box_left, startPos)){
            seg_move_mode = "left"
          }
          if (containsPoint(temp_box_right, startPos)){
            seg_move_mode = "right"
          }
          break
        }
      }

      // chordBlock interactions
      let chdBlockIdx = -1
      let original_width_chd = 0
      let original_x_chd = 0
      let chd_move_mode = "move"
      for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
        if (containsPoint(rootStore.arrangeViewStore.chordBlocks[i], startPos)){
          let block = rootStore.arrangeViewStore.chordBlocks[i]
          chdBlockIdx = i
          original_width_chd = block.width
          original_x_chd = block.x
          let temp_box_left = {x: block.x, y: block.y, width: rootStore.song.timebase/3, height: 1}
          let temp_box_right = {x: block.x + block.width - rootStore.song.timebase/3, y: block.y, width: rootStore.song.timebase/3, height: 1}
          if (containsPoint(temp_box_left, startPos)){
            chd_move_mode = "left"
          }
          if (containsPoint(temp_box_right, startPos)){
            chd_move_mode = "right"
          }
          break
        }
      }

      let original_width = 0
      let original_x = 0
      if (rootStore.arrangeViewStore.selection_con != null && isSelectionSelected_con){
        original_width = rootStore.arrangeViewStore.selection_con.width
      }

      const createSelectionHandler = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        arrangeStartSelection(rootStore)(startPos)

        if (!rootStore.services.player.isPlaying) {
          setPlayerPosition(rootStore)(startPos.x)
        }

        mouseMove((e) => {
          arrangeResizeSelection(rootStore)(startPos, createPoint(e))
        })
        mouseUp((e) => {
          arrangeEndSelection(rootStore)(startPos, createPoint(e))
        })
      }

      const dragSelectionHandler = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        if (selection === null) {
          return
        }
        const startSelection = cloneDeep(selection)
        mouseMove((e) => {
          const delta = pointSub(createPoint(e), startPos)
          const pos = pointAdd(startSelection, delta)
          arrangeMoveSelection(rootStore)(pos)
        })
        mouseUp((e) => {})
      }
      
      const dragSelectionHandler_con = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        mouseMove((e) => {
          const delta = pointSub(createPoint(e), startPos).x
          
          if (rootStore.arrangeViewStore.selection_con != null && isSelectionSelected_con){
            if (original_width + delta > rootStore.song.timebase*2){
              rootStore.assistStore.con.display_buttons = false
            }
            rootStore.arrangeViewStore.selection_con.width = Math.max(original_width + delta, rootStore.song.timebase*2)
          }
        })
        mouseUp((e) => {if (isSelectionSelected_con){
          ConGenerate(rootStore)
          if (rootStore.arrangeViewStore.selection_con != null && isSelectionSelected_con){
            rootStore.arrangeViewStore.selection_con.width = rootStore.arrangeViewStore.selection_con.width + 1
          }
        }})
      }

      const segHandler = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        mouseMove((e) => {
          const delta = pointSub(createPoint(e), startPos).x

          if (segBlockIdx > -1){
            if (seg_move_mode == "left"){
              let delta_width = rootStore.song.timebase*4*(Math.floor((delta+2*rootStore.song.timebase)/(rootStore.song.timebase*4)))
              let new_x = original_x_seg + delta_width
              let new_width = original_width_seg - delta_width
              if (new_width < rootStore.song.timebase * 4 || new_x < 0){
                return
              }
              for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
                let block = rootStore.arrangeViewStore.segmentBlocks[i]
                if (new_x < block.x + block.width && block.x + block.width <= rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].x){
                  if (block.width <= rootStore.song.timebase*4){
                    return
                  }
                  block.width -= rootStore.song.timebase*4
                }
              }
              rootStore.arrangeViewStore.segmentBlocks[segBlockIdx] = {x: new_x, y:1, width: new_width, height: 1, value: rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].value, color: rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].color}
            }
            else if (seg_move_mode == "right"){
              let new_width = Math.max(rootStore.song.timebase*4, original_width_seg + rootStore.song.timebase*4*(Math.floor((delta+2*rootStore.song.timebase)/(rootStore.song.timebase*4))))
              let new_end = new_width + rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].x
              for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
                let block = rootStore.arrangeViewStore.segmentBlocks[i]
                if (new_end > block.x && block.x > rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].x){
                  if (block.width == rootStore.song.timebase*4){
                    return
                  }
                  block.x += rootStore.song.timebase*4
                  block.width -= rootStore.song.timebase*4
                }
              }
              rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].width = new_width
            }
            else{ 
              let new_x = rootStore.song.timebase*4*(Math.floor((delta+2*rootStore.song.timebase)/(rootStore.song.timebase*4))) + original_x_seg
              let width = rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].width
              for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
                if (i == segBlockIdx){
                  continue
                }
                let block = rootStore.arrangeViewStore.segmentBlocks[i]
                if ((new_x <= block.x && new_x+width > block.x) || (new_x >= block.x && new_x < block.x + block.width)){
                  return
                }
              }
              rootStore.arrangeViewStore.segmentBlocks[segBlockIdx].x = new_x
            }
          }
        })
        mouseUp((e) => {})
      }

      const chdHandler = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        mouseMove((e) => {
          const delta = pointSub(createPoint(e), startPos).x

          if (chdBlockIdx > -1){
            if (chd_move_mode == "left"){
              let delta_width = rootStore.song.timebase*(Math.floor((delta)/(rootStore.song.timebase)))
              let new_x = original_x_chd + delta_width
              let new_width = original_width_chd - delta_width
              if (new_width < rootStore.song.timebase || new_x < 0){
                return
              }
              for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
                let block = rootStore.arrangeViewStore.chordBlocks[i]
                if (new_x < block.x + block.width && block.x + block.width <= rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].x){
                  if (block.width <= rootStore.song.timebase){
                    return
                  }
                  block.width -= rootStore.song.timebase
                }
              }
              rootStore.arrangeViewStore.chordBlocks[chdBlockIdx] = {x: new_x, y: 2, width: new_width, height: 1, chd_string: rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].chd_string, chd_mat: rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].chd_mat, color: rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].color}
            }
            else if (chd_move_mode == "right"){
              let new_width = Math.max(rootStore.song.timebase, original_width_chd + rootStore.song.timebase*(Math.floor((delta)/(rootStore.song.timebase))))
              let new_end = new_width + rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].x
              for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
                let block = rootStore.arrangeViewStore.chordBlocks[i]
                if (new_end > block.x && block.x > rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].x){
                  if (block.width == rootStore.song.timebase){
                    return
                  }
                  block.x += rootStore.song.timebase
                  block.width -= rootStore.song.timebase
                }
              }
              rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].width = new_width
            }
            else{ 
              let new_x = rootStore.song.timebase*(Math.floor((delta)/(rootStore.song.timebase))) + original_x_chd
              let width = rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].width
              for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
                if (i == chdBlockIdx){
                  continue
                }
                let block = rootStore.arrangeViewStore.chordBlocks[i]
                console.log(i,chdBlockIdx, new_x, new_x+width, block.x, block.x+block.width)
                if ((new_x <= block.x && new_x+width > block.x) || (new_x >= block.x && new_x < block.x + block.width)){
                  return
                }
              }
              rootStore.arrangeViewStore.chordBlocks[chdBlockIdx].x = new_x
            }
          }
        })
        mouseUp((e) => {})
      }

      let segDraw_original_x = 0
      const segDraw = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        mouseMove((e) => {

          let x = Math.floor((createPoint(e).x + 2*rootStore.song.timebase) / (4*rootStore.song.timebase)) * rootStore.song.timebase * 4
          let block = rootStore.arrangeViewStore.segmentBlocks[rootStore.arrangeViewStore.segmentBlocks.length-1]
          if (x < 0) {return}
          for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length-1; i++){
            let other_block = rootStore.arrangeViewStore.segmentBlocks[i]
            if ((other_block.x < x && other_block.x+other_block.width > x) 
            || (other_block.x >= x && other_block.x < segDraw_original_x) 
            || (other_block.x < x && other_block.x > segDraw_original_x)){
              return
            }
          }
          if (x > segDraw_original_x){
            block.width = x - segDraw_original_x
          }
          else{
            let new_block = {
              x: x,
              width: segDraw_original_x - block.x + 4*rootStore.song.timebase,
              y: 1,
              height: 1,
              value: block.value,
              color: block.color
            }
            rootStore.arrangeViewStore.segmentBlocks[rootStore.arrangeViewStore.segmentBlocks.length-1] = new_block
          }
        })
        mouseUp((e) => {})
      }

      let chdDraw_original_x = 0
      const chdDraw = (
        e: MouseEvent,
        mouseMove: (handler: (e: MouseEvent) => void) => void,
        mouseUp: (handler: (e: MouseEvent) => void) => void
      ) => {
        mouseMove((e) => {

          let x = Math.floor((createPoint(e).x ) / (rootStore.song.timebase)) * rootStore.song.timebase
          let block = rootStore.arrangeViewStore.chordBlocks[rootStore.arrangeViewStore.chordBlocks.length-1]
          if (x < 0) {return}
          for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length-1; i++){
            let other_block = rootStore.arrangeViewStore.chordBlocks[i]
            if ((other_block.x < x && other_block.x+other_block.width > x) 
            || (other_block.x >= x && other_block.x < chdDraw_original_x) 
            || (other_block.x < x && other_block.x > chdDraw_original_x)){
              return
            }
          }
          if (x > chdDraw_original_x){
            block.width = x - chdDraw_original_x
          }
          else{
            let new_block = {
              x: x,
              width: chdDraw_original_x - block.x + rootStore.song.timebase,
              y: 2,
              height: 1,
              chd_string: block.chd_string,
              chd_mat: block.chd_mat,
              color: block.color
            }
            rootStore.arrangeViewStore.chordBlocks[rootStore.arrangeViewStore.chordBlocks.length-1] = new_block
          }
        })
        mouseUp((e) => {})
      }

      let handler

      // Drag continuation block
      if (rootStore.assistStore.active == "continuation"){
        handler = dragSelectionHandler_con
      }
      else if (rootStore.assistStore.active == "selection"){
        if (startPos.y > 1 && startPos.y < 2){
          handler = segHandler
        }
        else if (startPos.y > 2 && startPos.y < 3){
          handler = chdHandler
        }
        else if (isSelectionSelected) {
          handler = dragSelectionHandler
        } else {
          handler = createSelectionHandler
        }
      }
      else if (rootStore.assistStore.active == "pencil"){
        // Draw blocks if the cursor is not inside and existing block
        if (startPos.y > 1 && startPos.y < 2){
          for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
            if (containsPoint(rootStore.arrangeViewStore.segmentBlocks[i], startPos)){
              return
            }
          }
          let x = Math.floor((startPos.x) / (4*rootStore.song.timebase)) * rootStore.song.timebase * 4
          rootStore.arrangeViewStore.segmentBlocks.push({x: x, y: 1, width:4*rootStore.song.timebase, height: 1, value: String.fromCharCode(65+rootStore.arrangeViewStore.segmentBlocks.length) ,color: undefined})
          segDraw_original_x = x
          handler = segDraw
        }
        else if (startPos.y > 2 && startPos.y < 3){
          for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
            if (containsPoint(rootStore.arrangeViewStore.chordBlocks[i], startPos)){
              return
            }
          }
          let x = Math.floor((startPos.x) / (rootStore.song.timebase)) * rootStore.song.timebase
          rootStore.arrangeViewStore.chordBlocks.push({x: x, y: 2, width:rootStore.song.timebase, height: 1, chd_string: "C", chd_mat: [],color: undefined})
          chdDraw_original_x = x
          handler = chdDraw
        }
        else{return}
      }
      else{return}
      

      let mouseMove: (e: MouseEvent) => void
      let mouseUp: (e: MouseEvent) => void
      handler(
        e.nativeEvent,
        (fn) => (mouseMove = fn),
        (fn) => (mouseUp = fn)
      )

      observeDrag({
        onMouseMove: (e) => mouseMove(e),
        onMouseUp: (e) => mouseUp(e),
      })
    },
    [selection, rootStore]
  )

  const handleMiddleClick = useCallback(
    (e: React.MouseEvent) => {
      function createPoint(e: MouseEvent) {
        return { x: e.clientX, y: e.clientY }
      }
      const startPos = createPoint(e.nativeEvent)

      observeDrag({
        onMouseMove(e) {
          const pos = createPoint(e)
          const delta = pointSub(pos, startPos)
          setScrollLeft(Math.max(0, scrollLeft - delta.x))
          setScrollTop(Math.max(0, scrollTop - delta.y))
        },
      })
    },
    [scrollLeft, scrollTop]
  )

  const { onContextMenu, menuProps } = useContextMenu()

  
  var last_time = 0

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { left, top } = e.currentTarget.getBoundingClientRect()

      function createPoint(e: MouseEvent) {
        const x = e.pageX - left + scrollLeft
        const y = e.pageY - top - Layout.rulerHeight + scrollTop
        const tick = transform.getTicks(x)
        return { x: tick, y: y / trackHeight }
      }

      let date = new Date()
      let time = date.getTime()
      const startPos = createPoint(e.nativeEvent)

      // Double click for popovers
      if (time - last_time < 400 && rootStore.assistStore.active == "selection"){
        for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
          let block = rootStore.arrangeViewStore.segmentBlocks[i]
          if (containsPoint(block, startPos)){
            setAnchor( {left: e.pageX - left + scrollLeft, top: e.pageY - top - Layout.rulerHeight + scrollTop + top})
            setSelectedSegIdx(i)
            rootStore.assistStore.blockSelection.selectedSegIdx = i
            return
          }
        }
        for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
          let block = rootStore.arrangeViewStore.chordBlocks[i]
          if (containsPoint(block, startPos)){
            setAnchor_chd( {left: e.pageX - left + scrollLeft, top: e.pageY - top - Layout.rulerHeight + scrollTop + top})
            setSelectedChdIdx(i)
            rootStore.assistStore.blockSelection.selectedChdIdx = i
            return
          }
        }
      }
      last_time = time

      switch (e.button) {
        case 0:
          handleLeftClick(e, createPoint)
          break
        case 1:
          handleMiddleClick(e)
          break
        case 2:
          // Delete blocks
          for (let i=0; i<rootStore.arrangeViewStore.segmentBlocks.length; i++){
            let block = rootStore.arrangeViewStore.segmentBlocks[i]
            if (containsPoint(block, startPos)){
              rootStore.arrangeViewStore.segmentBlocks.splice(i,1)
              return
            }
          }
          for (let i=0; i<rootStore.arrangeViewStore.chordBlocks.length; i++){
            let block = rootStore.arrangeViewStore.chordBlocks[i]
            if (containsPoint(block, startPos)){
              rootStore.arrangeViewStore.chordBlocks.splice(i,1)
              return
            }
          }
          onContextMenu(e)
          break
        default:
          break
      }
    },
    [
      scrollLeft,
      scrollTop,
      transform,
      handleLeftClick,
      handleMiddleClick,
      onContextMenu,
    ]
  )

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const scrollLineHeight = trackHeight
      const delta = scrollLineHeight * (e.deltaY > 0 ? 1 : -1)
      setScrollTop(scrollTop + delta)
    },
    [scrollTop]
  )

  const [renderer, setRenderer] = useState<ArrangeViewRenderer | null>(null)

  useEffect(() => {
    if (renderer === null) {
      return
    }

    const [highlightedBeats, nonHighlightedBeats] = partition(
      mappedBeats,
      (b) => b.beat === 0
    )

    renderer.theme = theme
    renderer.render(
      cursorX,
      notes,
      selectionRect ?? zeroRect,
      selectionRect_con ?? zeroRect,
      segmentBlockRects,
      chordBlockRects,
      nonHighlightedBeats.map((b) => b.x),
      highlightedBeats.map((b) => b.x),
      tracks.map((_, i) => trackHeight * (i + 1) - 1),
      { x: scrollLeft, y: scrollTop }
    )
  }, [
    renderer,
    tracks.length,
    scrollLeft,
    scrollTop,
    cursorX,
    notes,
    mappedBeats,
    selectionRect,
    selectionRect_con,
    segmentBlockRects,
    chordBlockRects,
  ])

  const openTrack = (trackId: number) => {
    rootStore.router.pushTrack()
    selectTrack(rootStore)(trackId)
  }

  // Popover for seg blocks
  const [anchor, setAnchor] = useState<any | null>(null)

  const handleClose_seg = () => {
    setAnchor(null)
    let new_segname = (document.getElementById("seg_name") as HTMLInputElement).value
    if (new_segname != ""){
      rootStore.arrangeViewStore.segmentBlocks[selectedSegIdx].value = new_segname
    }
  };

  const [selectedSegIdx, setSelectedSegIdx] = useState<number>(0)

  // Popover for chd blocks
  const [anchor_chd, setAnchor_chd] = useState<any | null>(null)

  const handleClose_chd = () => {
    setAnchor_chd(null)
  };

  const [selectedChdIdx, setSelectedChdIdx] = useState<number>(0)

  return (
    <Wrapper>
      <HeaderList>
        <LeftTopSpace style={{ height: Layout.rulerHeight }}/>
        <div
          style={{
            marginTop: Layout.rulerHeight,
            transform: `translateY(${-scrollTop}px)`,
          }}
        >
          {tracks.map((t, i) => (
            <TrackHeader
              style={{ height: trackHeight }}
              key={i}
              onDoubleClick={() => {
                if (i == 0 || i > 2){
                  openTrack(i)
                }
                
              }}
            >
              {t.displayName}
            </TrackHeader>
          ))}
        </div>
        <LeftBottomSpace style={{ height: BAR_WIDTH }} />
      </HeaderList>
      <div
        ref={ref}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onContextMenu={useCallback((e) => e.preventDefault(), [])}
        onWheel={onWheel}
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
          background: Color(theme.backgroundColor).darken(0.1).hex(),
        }}
      >
        <CanvasPianoRuler
          width={containerWidth}
          beats={mappedBeats}
          scrollLeft={scrollLeft}
          pixelsPerTick={transform.pixelsPerTick}
          style={{
            background: theme.backgroundColor,
            borderBottom: `1px solid ${theme.dividerColor}`,
            boxSizing: "border-box",
          }}
        />
        <GLCanvas
          style={{ pointerEvents: "auto" }}
          onCreateContext={useCallback(
            (gl) => setRenderer(new ArrangeViewRenderer(gl)),
            []
          )}
          width={containerWidth}
          height={contentHeight}
          id = "ArrangeCanvas"
        />
        <div
          style={{
            width: `calc(100% - ${BAR_WIDTH}px)`,
            position: "absolute",
            bottom: 0,
          }}
        >
          <HorizontalScaleScrollBar
            scrollOffset={scrollLeft}
            contentLength={contentWidth}
            onScroll={setScrollLeft}
            onClickScaleUp={onClickScaleUp}
            onClickScaleDown={onClickScaleDown}
            onClickScaleReset={onClickScaleReset}
          />
        </div>
      </div>
      <div
        style={{
          height: `calc(100% - ${BAR_WIDTH}px)`,
          position: "absolute",
          top: 0,
          right: 0,
        }}
      >
        <VerticalScrollBar
          scrollOffset={scrollTop}
          contentLength={contentHeight + Layout.rulerHeight}
          onScroll={setScrollTop}
        />
      </div>
      <div
        style={{
          width: BAR_WIDTH,
          height: BAR_WIDTH,
          position: "absolute",
          bottom: 0,
          right: 0,
          background: theme.backgroundColor,
        }}
      />
      
      <ArrangeContextMenu {...menuProps} />
      <ConResampleButton />
      <SegBlockValueDisplay />
      <ChordBlockValueDisplay />
      <Popover
        open={anchor != null}
        anchorReference="anchorPosition"
        anchorPosition={anchor}
        onClose={handleClose_seg}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <form>
        <p>Segment name:</p> <TextField id="seg_name" defaultValue={rootStore.arrangeViewStore.segmentBlocks[rootStore.assistStore.blockSelection.selectedSegIdx] ? rootStore.arrangeViewStore.segmentBlocks[rootStore.assistStore.blockSelection.selectedSegIdx].value:""}/>
        </form>
      </Popover>
      <Popover
        open={anchor_chd != null}
        anchorReference="anchorPosition"
        anchorPosition={anchor_chd}
        onClose={handleClose_chd}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <ChordDial />
      </Popover>
    </Wrapper>
  )
})
