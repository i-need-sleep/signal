import { Hidden, withStyles } from "@material-ui/core"
import Slider from "@material-ui/core/Slider"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useState } from "react"
import styled from "styled-components"
import { theme } from "../../../../common/theme/muiTheme"
import { Button } from '@material-ui/core';
import * as d3 from "d3";
import { accGenerate } from "./AccGen"
import { useStores } from "../../../hooks/useStores"

let x = -1
let y = -1
let svg: any
let circle: any
let dragging = false

const dragHandler = d3.drag()
.on("drag", function (e:any) {
  if (e.x < 300 && e.y < 300 && e.x > 0 && e.y > 0)
    x = e.x
    y = e.y
    d3.selectAll(".circle")
        .attr("cx", e.x)
        .attr("cy", e.y);
});

const canvas_size = 300
const n_bins = 5
const line_width = 2

const _AccFilterSelect: FC<any> = observer((set) => {

  useEffect(() => {
    svg = d3.select('#selector')

    // Set up the background and selector movement
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', canvas_size)
      .attr('height', canvas_size)
      .attr('opacity', 0)
      .classed("background", true)
      .on('mousedown', function(e:any){
        
        d3.selectAll('.circle').remove().exit()

        circle = svg.append('circle')
          .attr('cx', e.layerX)
          .attr('cy', e.layerY)
          .attr('r', 10)
          .attr('fill', 'white')
          .classed('circle', true)

          dragHandler(svg.selectAll(".circle"));

      })
      
    dragHandler(svg.selectAll(".background"));

    // Add lines
    for (let i=1; i<n_bins; i++){
      svg.append('rect')
      .attr('x', i * canvas_size / n_bins)
      .attr('y', 0)
      .attr('width', line_width)
      .attr('height', canvas_size)
      .attr('fill', 'white')
      .attr('opacity', 0.07)

      svg.append('rect')
      .attr('x', 0)
      .attr('y', i * canvas_size / n_bins)
      .attr('width', canvas_size)
      .attr('height', line_width)
      .attr('fill', 'white')
      .attr('opacity', 0.07)
    }

    // Setup note icons
    // Generated here: https://jsfiddle.net/srj9x0qk/117/

  })

  // Button interactions
  const clear = (e: any) => {
    e.stopPropagation();
    d3.selectAll('.circle').remove().exit()
    x = -1
    y = -1
  }

  const confirm = (e: any) => {
    e.stopPropagation();
    // Close the popup
    set.set(null)

    // Generate
    let filter:any[] = []
    if (x < 0 || y < 0){
      filter = []
    }
    else {
      filter = [Math.floor(n_bins*x/canvas_size),n_bins-1-Math.floor(n_bins*y/canvas_size)]
    }
    accGenerate(set.rootStore, filter)  //Horizontal, vertical
  }

  return (
    <div>
      <svg width={canvas_size} height={canvas_size} id='selector' /><br/> {/*style={{padding: '10px'}}*/}
      <Button onClick={confirm}>Confirm</Button>
      <Button onClick={clear}>Clear</Button>
      <img src='accFilter_icons/vSparse.svg' height='300' width='300' 
          style={{position: 'absolute', left: 99, top: 220, opacity: 0.6, pointerEvents: 'none'}}
        />
        <img src='accFilter_icons/vDense.svg' height='300' width='300' 
          style={{position: 'absolute', left: 99, top: -20, opacity: 0.6, pointerEvents: 'none'}}
        />
        <img src='accFilter_icons/hSparse.svg' height='300' width='300' 
          style={{position: 'absolute', left: -25, top: 88, opacity: 0.6, pointerEvents: 'none'}}
        />
        <img src='accFilter_icons/hDense.svg' height='200' width='200' 
          style={{position: 'absolute', left: 215, top: 110, opacity: 0.6, pointerEvents: 'none'}}
        />
    </div>

  )
})

export const AccFilterSelect = React.memo(_AccFilterSelect)
