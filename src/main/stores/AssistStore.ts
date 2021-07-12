import { action, makeObservable, observable } from "mobx";
import RootStore from "./RootStore";

export type Active = "continuation" | "selection" | "pencil"

export default class AssistStore {
  private rootStore: RootStore

  active: Active = "selection";
  con={
    quantPerQuarter: 4,
    rnn_temperature: 1,
    display_buttons: false
  }
  temp_notes: number[] = []
  blockstyle={
    left: 7,
    top: 4
  }
  blockSelection={
    selectedSegIdx: 0,
    selectedChdIdx: 0
  }

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    makeObservable(this, {
      active: observable,
      con: observable,
      blockstyle: observable,
      blockSelection: observable,
      toggleActive: action,
    })
  }

  toggleActive() {
    this.active === "continuation" ? ("selection" ? "pencil" : "selection") : "continuation"
  }
}
