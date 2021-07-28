import { Button, Menu, MenuItem } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import * as d3 from "d3";
import { FC, useEffect, useState } from "react";
import { useStores } from "../../../hooks/useStores";


export const ChordDial: FC = () => {
  
  document.body.style.cursor = "auto"
  const { arrangeViewStore, assistStore } = useStores()
  let block_idx = assistStore.blockSelection.selectedChdIdx
  const opacity = { normal: 0.6, hover: 1, check: 0.9 };
  const inner_text = [
          "min",
          "dim",
          "aug",
          "maj",
          "M7",
          "m7",
          "Mm7",
          "mM7",
          "o7",
          "ø7",
        ];
  const outer_text = [
          "+2(9)",
          "+4(11)",
          "+6(13)",
          "b9",
          "#9",
          "#11",
          "b13",
          "sus2",
          "sus4",
          "omit3",
          "omit5",
        ]

  const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


  const draw_dial = function(root:any) {
    const dial_r_outer = 120;
    const dial_r_inner = (2 * dial_r_outer) / 3;
    const dial_r_center = dial_r_outer / 4;

    // Tuned manually after resizing
    const outer_text_offset = 34;
    const inner_text_offset_upper = 28;
    const inner_text_offset_lower = 22;
    const center_text_offset = 1;

    const inner_rads = [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2];
    const outer_rads = [0, 0.2, 0.4, 0.6, 0.75, 0.9, 1.05, 1.2, 1.4, 1.6, 1.8, 2];
    const dial_handler_length = 15;

    const middleFontSize =  "25px"
    const outerFontSize = "18px"
    const innerFontSize = "15px"

    let outer_color_scale = [
            70,
            80,
            90,
            100,
            110,
            120,
            130,
            140,
            150,
            160,
            170,
            180,
          ]
    var arc_color: any = d3.color("hsla(250, 16%, 75%, 1)")

    let g = d3
      .select("#chord_dial")
      .append("g")
      .attr("id", "g_center")
      .attr("class", "g")
      .attr(
        "transform",
        "translate(" +
          (dial_r_outer + dial_handler_length + 1) +
          "," +
          (dial_r_outer + dial_handler_length + 1) +
          ")"
      );
    let g_inner = d3
      .select("#g_center")
      .append("g")
      .attr("id", "g_inner")
      .attr("class", "g");

    let g_outer = d3
      .select("#g_center")
      .append("g")
      .attr("id", "g_outer")
      .attr("class", "g");

    // Outer Ring
    for (let i = 0; i < outer_rads.length - 1; i++) {
      let color = arc_color;
      if (color == undefined){
        color = ""
      }
      let arc: any = d3
        .arc()
        .innerRadius(dial_r_inner)
        .outerRadius(dial_r_outer)
        .startAngle(outer_rads[i] * Math.PI)
        .endAngle(outer_rads[i + 1] * Math.PI);

      g_outer
        .append("path")
        .attr("d", arc)
        .attr("id", "outer_path" + i)
        .attr("class", "outer_path")
        // Can be edited in CSS by referencing the class/id
        .style("fill", color)
        .style("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", opacity.normal)
        .on("click", function() {
          outer_on_click(i)
        })
        .on("mouseover", function() {
          if (d3.select("#outer_path" + i).classed("path_selected")) {
            return;
          }
          d3.select("#outer_path" + i).style("opacity", opacity.hover);
        })
        .on("mouseout", function() {
          if (d3.select("#outer_path" + i).classed("path_selected")) {
            return;
          }
          d3.select("#outer_path" + i).style("opacity", opacity.normal);
        });

      g_outer
        .append("text")
        .attr("dx", outer_text_offset)
        .attr("dy", (1 + dial_r_outer) / 6)
        .append("textPath")
        .attr("xlink:href", "#outer_path" + i)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("fill", "black")
        .style("stroke", "black")
        .style("stroke-width", "0")
        .style("font-size", outerFontSize)
        .style("user-select", "none")
        .attr("id", "outer_text" + i)
        .text(outer_text[i])
        .on("click", function() {
          outer_on_click(i)
          })
        .on("mouseover", function() {
          if (d3.select("#outer_path" + i).classed("path_selected")) {
            return;
          }
          d3.select("#outer_path" + i).style("opacity", opacity.hover);
        })
        .on("mouseout", function() {
          if (d3.select("#outer_path" + i).classed("path_selected")) {
            return;
          }
          d3.select("#outer_path" + i).style("opacity", opacity.normal);
        });
    }

    // Inner Ring
    for (let i = 0; i < inner_rads.length - 1; i++) {
      let color = arc_color;
      if (color === undefined){
        color = ''
      }
      let arc :any = d3
        .arc()
        .innerRadius(dial_r_center)
        .outerRadius(dial_r_inner)
        .startAngle(inner_rads[i] * Math.PI)
        .endAngle(inner_rads[i + 1] * Math.PI);

      g_inner
        .append("path")
        .attr("d", arc)
        .attr("id", "inner_path" + i)
        .attr("class", "inner_path")
        .style("fill", color)
        .style("opacity", opacity.normal)
        .style("stroke", "black")
        .style("stroke-width", "2px")
        .on("click", function() {
          inner_on_click(i)
        })
        .on("mouseover", function() {
          if (d3.select("#inner_path" + i).classed("path_selected")) {
            return;
          }
          d3.select("#inner_path" + i).style("opacity", opacity.hover);
        })
        .on("mouseout", function() {
          if (d3.select("#inner_path" + i).classed("path_selected")) {
            return;
          }
          d3.select("#inner_path" + i).style("opacity", opacity.normal);
        });

      if (0 < i && i < 7) {
        g_inner
          .append("text")
          .attr("dx", inner_text_offset_lower)
          .attr("dy", (1 + dial_r_outer) / 6)
          .append("textPath")
          .attr("xlink:href", "#inner_path" + i)
          .style("text-anchor", "middle")
          .style("dominant-baseline", "middle")
          .style("fill", "black")
          .style("stroke", "black")
          .style("stroke-width", "0")
          .style("font-size", innerFontSize)
          .style("letter-spacing", "0.1em")
          .style("user-select", "none")
          .text(inner_text[i])
          .on("click", function() {
            inner_on_click(i)
          })
          .on("mouseover", function() {
            if (d3.select("#inner_path" + i).classed("path_selected")) {
              return;
            }
            d3.select("#inner_path" + i).style("opacity", opacity.hover);
          })
          .on("mouseout", function() {
            if (d3.select("#inner_path" + i).classed("path_selected")) {
              return;
            }
            d3.select("#inner_path" + i).style("opacity", opacity.normal);
          });
      } else {
        g_inner
          .append("text")
          .attr("dx", inner_text_offset_upper)
          .attr("dy", (1 + dial_r_outer) / 5)
          .append("textPath")
          .attr("xlink:href", "#inner_path" + i)
          .style("text-anchor", "middle")
          .style("dominant-baseline", "middle")
          .style("fill", "black")
          .style("stroke", "black")
          .style("stroke-width", "0")
          .style("font-size", innerFontSize)
          .style("letter-spacing", "0.1em")
          .style("user-select", "none")
          .attr("id", "inner_text")
          .text(inner_text[i])
          .on("click", function() {
            inner_on_click(i)
          })
          .on("mouseover", function() {
            if (d3.select("#inner_path" + i).classed("path_selected")) {
              return;
            }
            d3.select("#inner_path" + i).style("opacity", opacity.hover);
          })
          .on("mouseout", function() {
            if (d3.select("#inner_path" + i).classed("path_selected")) {
              return;
            }
            d3.select("#inner_path" + i).style("opacity", opacity.normal);
          });
      }
    }

    g.append("circle")
      .attr("x", 0)
      .attr("y", 0)
      .attr("r", dial_r_center)
      .style("fill", arc_color)
      .style("opacity", 0.6)
      .style("stroke", "black")
      .style("stroke-width", "2px")
      .on("click", function() {
        let g = d3.select("#g_outer");
        g.transition()
          .duration(500)
          .attr("transform", `rotate(180,0,0)`);
      });

    g.append("text")
      .attr("dy", center_text_offset)
      .style("text-anchor", "middle")
      .style("dominant-baseline", "middle")
      .style("fill", "black")
      .style("stroke-width", "0")
      .style("font-size", middleFontSize)
      .style("user-select", "none")
      .attr("id", "center_text")
      .text(root)
      .on("click", function() {
      
      });
  }

 
  const [ setup, setSetup ] = useState(false)

  useEffect(() => {
    if (!setup){
      draw_dial('')
      update_highlights()
      setSetup(true)
    }
  })

  function outer_on_click(i: number){
    let outerLst = arrangeViewStore.chordBlocks[block_idx].chd_mat[2]
    if (outerLst.includes(i)){
      arrangeViewStore.chordBlocks[block_idx].chd_mat[2].splice(outerLst.indexOf(i),1)
    }
    else (
      arrangeViewStore.chordBlocks[block_idx].chd_mat[2].push(i)
    )
    update_highlights()
  }

  function inner_on_click(i: number){
    arrangeViewStore.chordBlocks[block_idx].chd_mat[1] = i
    update_string()
    update_highlights()
  }

  function update_highlights(){
    let outerLst = arrangeViewStore.chordBlocks[block_idx].chd_mat[2]
    for (let i=0; i<outer_text.length; i++){
      if (outerLst.includes(i)){
        d3.select("#outer_path" + i).classed("path_selected", true)
        d3.select("#outer_path" + i).style("opacity", opacity.check)
      }
      else{
        d3.select("#outer_path" + i).classed("path_selected", false)
      }
    }
    for (let i=0; i<inner_text.length; i++){
      if (arrangeViewStore.chordBlocks[block_idx].chd_mat[1] == i){
        d3.select("#inner_path" + i).classed("path_selected", true)
        d3.select("#inner_path" + i).style("opacity", opacity.check)
      }
      else{
        d3.select("#inner_path" + i).classed("path_selected", false)
        d3.select("#inner_path" + i).style("opacity", opacity.normal)
      }
    }
    d3.select("#center_text").text(pitches[arrangeViewStore.chordBlocks[block_idx].chd_mat[0]])
  }

  function update_string(){
    arrangeViewStore.chordBlocks[block_idx].chd_string = pitches[arrangeViewStore.chordBlocks[block_idx].chd_mat[0]] + inner_text[arrangeViewStore.chordBlocks[block_idx].chd_mat[1]]
  }
  
  const [ anchorEl_root, setAnchorEl_root ] = useState(null)

  const handleClose_root = (i:any) => {
    setAnchorEl_root(null)
    if (! (i >= 0)){
      return
    }
    arrangeViewStore.chordBlocks[block_idx].chd_mat[0] = i
    arrangeViewStore.chordBlocks[block_idx].chd_mat[3] = i
    update_highlights()
    update_string()
  }
  const handleClick_root = (e: any) => {
    setSetup(true)
    setAnchorEl_root(e.currentTarget)
  }
  
let root_choices = []
for (let i=0; i<pitches.length; i++){
  let pitch = pitches[i]
  root_choices.push(<MenuItem onClick={()=>{handleClose_root(i)}}>{pitch}</MenuItem>)
}

const [ anchorEl_bass, setAnchorEl_bass ] = useState(null)

const handleClose_bass = (i:any) => {
  setAnchorEl_bass(null)
  console.log(i)
  if (! (i >= 0)){
    return
  }
  arrangeViewStore.chordBlocks[block_idx].chd_mat[3] = i
  update_highlights()
  update_string()
}
const handleClick_bass = (e: any) => {
  setSetup(true)
  setAnchorEl_bass(e.currentTarget)
}

let bass_choices = []
for (let i=0; i<pitches.length; i++){
let pitch = pitches[i]
bass_choices.push(<MenuItem onClick={()=>{handleClose_bass(i)}}>{pitch}</MenuItem>)
}

  return (
    <div >
        <Grid container spacing={3}>
          <Grid item xs={9}>
            <svg id="chord_dial" className="chord_dial" height="300px" width="300px"></svg>
          </Grid>

          <Grid item xs={3}>
            <p style={{width: 200}}>Root </p>
            <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick_root}>
              {pitches[arrangeViewStore.chordBlocks[block_idx].chd_mat[0]]}
            </Button>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl_root}
              keepMounted
              open={Boolean(anchorEl_root)}
              onClose={handleClose_root}
            >
              {root_choices}
            </Menu>
            <p> Bass </p>
            <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick_bass}>
              {pitches[arrangeViewStore.chordBlocks[block_idx].chd_mat[3]]}
            </Button>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl_bass}
              keepMounted
              open={Boolean(anchorEl_bass)}
              onClose={handleClose_bass}
            >
              {bass_choices}
            </Menu>
          </Grid>
      </Grid>
    </div>
  )
}
