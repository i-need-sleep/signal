import { makeObservable, observable } from "mobx";
import RootStore from "./RootStore";

export type Active = "continuation" | "selection" | "pencil" | "arrangement"

export default class AssistStore {
  private rootStore: RootStore

  // The selected tool
  active: Active = "selection";

  // Continuation
  con={
    quantPerQuarter: 4,
    rnn_temperature: 1,
    display_buttons: false
  }
  temp_notes: number[] = []

  // Blocks
  blockstyle={
    left: 7,
    top: 4
  }
  blockSelection={
    selectedSegIdx: 0,
    selectedChdIdx: 0
  }

  // Accompaniment
  acc = {posting: false}

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    makeObservable(this, {
      active: observable,
      con: observable,
      blockstyle: observable,
      blockSelection: observable,
      acc: observable,
    })
  }

}
