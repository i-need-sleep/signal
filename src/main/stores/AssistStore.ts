import { makeObservable, observable } from "mobx";
import RootStore from "./RootStore";

export type Active = "continuation" | "selection" | "pencil" | "arrangement"

export default class AssistStore {
  private rootStore: RootStore

  // The selected tool
  active: Active = "selection";

  // Loading backdrop
  loading: boolean = false

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
  acc = {
    posting: false, 

    // spotlight reference
    refs: [], 
    ref_chosen: '',
    
    // ref track
    ref_idx: -1,
  }

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    makeObservable(this, {
      active: observable,
      con: observable,
      blockstyle: observable,
      blockSelection: observable,
      acc: observable,
      loading: observable,
    })
  }

}
