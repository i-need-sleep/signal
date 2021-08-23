import { withStyles } from "@material-ui/core"
import Slider from "@material-ui/core/Slider"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback } from "react"
import styled from "styled-components"
import { theme } from "../../../../common/theme/muiTheme"
import { useStores } from "../../../hooks/useStores"


const LightSlider = withStyles({
  root: {
    color: theme.palette.primary.contrastText,
    marginRight: "1rem",
  },
})(Slider)

const Container = styled.div`
  display: flex;
  width: 8rem;
  margin-left: 1rem;
  margin-right: 1rem;
  align-items: center;
`

const _ConTempSlider: FC<any> = observer(() => {
  const rootStore = useStores()
  const temp = rootStore.assistStore.con.rnn_temperature

  const setTemp =
  (temp: number) => {
    rootStore.assistStore.con.rnn_temperature = temp

  }

  const onChange = useCallback(
    (value: number) => setTemp(value),
    [rootStore]
  )
  return (
    <Container onClick={(e)=>{e.stopPropagation()}}>
      <LightSlider
        value={temp}
        onChange={(_, value) => onChange(value as number)}
        max={2}
        step={0.01}
      />
    </Container>
  )
})

export const ConTempSlider = React.memo(_ConTempSlider)
