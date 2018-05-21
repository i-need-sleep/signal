import React, { StatelessComponent } from "react"
import { pure, Omit } from "recompose"
import LineGraphControl, { LineGraphControlProps, LineGraphControlEvent } from "./LineGraphControl"
import { Dispatcher } from "browser-main/createDispatcher";
import { CREATE_PAN } from "browser-main/actions";
import { ControllerEvent } from "midifile-ts"
import { TrackEvent } from "common/track"

export type PanGraphProps = Omit<LineGraphControlProps, 
  "createEvent" |
  "onClickAxis" |
  "maxValue" |
  "className" |
  "axis" |
  "events"
> & {
  events: TrackEvent[]
  dispatch: Dispatcher
}

const PanGraph: StatelessComponent<PanGraphProps> = ({
  width,
  height,
  scrollLeft,
  events,
  transform,
  dispatch,
  color
}) => {
  const filteredEvents = events.filter(e => (e as any).controllerType === 0x0a) as (LineGraphControlEvent & ControllerEvent)[]
  
  return <LineGraphControl
    className="PanGraph"
    width={width}
    height={height}
    scrollLeft={scrollLeft}
    transform={transform}
    maxValue={127}
    events={filteredEvents}
    axis={[-0x40, -0x20, 0, 0x20, 0x40 - 1]}
    createEvent={obj => dispatch(CREATE_PAN, obj)}
    onClickAxis={value => dispatch(CREATE_PAN, { value: value + 0x40 })}
    color={color}
  />
}

export default pure(PanGraph)