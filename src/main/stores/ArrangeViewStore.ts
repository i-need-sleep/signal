import { action, autorun, computed, makeObservable, observable } from "mobx"
import { IRect } from "../../common/geometry"
import { filterEventsWithScroll } from "../../common/helpers/filterEventsWithScroll"
import { createBeatsInRange } from "../../common/helpers/mapBeats"
import { isNoteEvent } from "../../common/track"
import { NoteCoordTransform } from "../../common/transform"
import { BAR_WIDTH } from "../components/inputs/ScrollBar"
import { Layout } from "../Constants"
import RootStore from "./RootStore"

export default class ArrangeViewStore {
  private rootStore: RootStore

  scaleX = 1
  scaleY = 1
  selection: IRect | null = null // Rect を使うが、x は tick, y はトラック番号を表す
  selection_con: IRect | null = null
  segmentBlocks: any[] = []
  chordBlocks: any[] = [] // [{x,y,width,height,color,chd_str,chd_mat=[root, inner, [outers], absolute_bass]}]
  selectedEventIds: { [key: number]: number[] } = {} // { trackId: [eventId] }
  autoScroll = true
  quantize = 0
  _scrollLeft = 0
  scrollTop = 0
  canvasWidth = 0
  canvasHeight = 0

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    makeObservable(this, {
      scaleX: observable,
      scaleY: observable,
      selection: observable,
      selection_con: observable,
      segmentBlocks: observable,
      chordBlocks: observable,
      autoScroll: observable,
      quantize: observable,
      _scrollLeft: observable,
      scrollTop: observable,
      canvasWidth: observable,
      canvasHeight: observable,
      scrollLeft: computed,
      transform: computed,
      notes: computed,
      cursorX: computed,
      mappedBeats: computed,
      trackHeight: computed,
      selectionRect: computed,
      selectionRect_con: computed,
      segmentBlockRects: computed,
      chordBlockRects: computed,
      contentWidth: computed,
      contentHeight: computed,
      setScrollLeft: action,
      setScrollTop: action,
    })
  }

  // keep scroll position to cursor
  setUpAutorun() {
    autorun(() => {
      const { isPlaying, position } = this.rootStore.services.player
      const { scrollLeft, transform, canvasWidth } = this
      if (this.autoScroll && isPlaying) {
        const x = transform.getX(position)
        const screenX = x - scrollLeft
        if (screenX > canvasWidth * 0.7 || screenX < 0) {
          this.setScrollLeft(x)
        }
      }
    })
  }

  get scrollLeft() {
    return this._scrollLeft
  }

  setScrollLeft(value: number) {
    const maxOffset = Math.max(0, this.contentWidth - this.canvasWidth)
    this._scrollLeft = Math.floor(Math.min(maxOffset, Math.max(0, value)))
  }

  setScrollTop(value: number) {
    const maxOffset = Math.max(
      0,
      this.contentHeight + Layout.rulerHeight + BAR_WIDTH - this.canvasHeight
    )
    this.scrollTop = Math.floor(Math.min(maxOffset, Math.max(0, value)))
  }

  scrollBy(x: number, y: number) {
    this.setScrollLeft(this.scrollLeft - x)
    this.setScrollTop(this.scrollTop - y)
  }

  get contentWidth(): number {
    const { scrollLeft, transform, canvasWidth } = this
    const startTick = scrollLeft / transform.pixelsPerTick
    const widthTick = transform.getTicks(canvasWidth)
    const endTick = startTick + widthTick
    return (
      Math.max(this.rootStore.song.endOfSong, endTick) * transform.pixelsPerTick
    )
  }

  get contentHeight(): number {
    return this.trackHeight * this.rootStore.song.tracks.length
  }

  get transform(): NoteCoordTransform {
    return new NoteCoordTransform(Layout.pixelsPerTick * this.scaleX, 0.3*2, 127)
  }


  get trackHeight(): number {
    const { transform } = this
    const bottomBorderWidth = 1
    return (
      Math.ceil(transform.pixelsPerKey * transform.numberOfKeys) +
      bottomBorderWidth
    )
  }

  get notes(): IRect[] {
    const { transform, trackHeight } = this

    return this.rootStore.song.tracks
      .map((t, i) =>
        filterEventsWithScroll(
          t.events,
          transform.pixelsPerTick,
          this.scrollLeft,
          this.canvasWidth
        )
          .filter(isNoteEvent)
          .map((e) => {
            const rect = transform.getRect(e)
            return { ...rect, height: 1*2, y: trackHeight * i+ rect.y }
          })
      )
      .flat()
  }

  get cursorX(): number {
    return this.transform.getX(this.rootStore.services.player.position)
  }

  get mappedBeats() {
    const { transform } = this
    const startTick = this.scrollLeft / transform.pixelsPerTick

    return createBeatsInRange(
      this.rootStore.song.measures,
      transform.pixelsPerTick,
      this.rootStore.song.timebase,
      startTick,
      this.canvasWidth
    )
  }

  get selectionRect(): IRect | null {
    const { transform, selection, trackHeight } = this
    return (
      selection && {
        x: transform.getX(selection.x),
        width: transform.getX(selection.width),
        y: selection.y * trackHeight,
        height: selection.height * trackHeight,
      }
    )
  }

  get selectionRect_con(): IRect | null {
    const { transform, selection_con, trackHeight } = this
    return (
      selection_con && {
        x: transform.getX(selection_con.x),
        width: transform.getX(selection_con.width),
        y: selection_con.y * trackHeight,
        height: selection_con.height * trackHeight,
      }
    )
  }

  get segmentBlockRects(): any {
    const { transform, segmentBlocks, trackHeight } = this
    if (!segmentBlocks){
      return null
    }
    let out = []
    for (let i = 0; i< segmentBlocks.length; i ++){
      out.push({
        x: transform.getX(segmentBlocks[i].x),
        width: transform.getX(segmentBlocks[i].width),
        y: 1 * trackHeight,
        height: 1 * trackHeight,
        color: segmentBlocks[i].color
      })
    }
    return out
  }

  get chordBlockRects(): any {
    const { transform, chordBlocks, trackHeight } = this
    if (!chordBlocks){
      return null
    }
    let out = []
    for (let i = 0; i< chordBlocks.length; i ++){
      out.push({
        x: transform.getX(chordBlocks[i].x),
        width: transform.getX(chordBlocks[i].width),
        y: 2 * trackHeight,
        height: 1 * trackHeight,
        color: chordBlocks[i].color
      })
    }
    return out
  }
}


