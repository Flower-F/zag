import * as rating from "@zag-js/rating-group"
import { ratingControls } from "@zag-js/shared"
import { normalizeProps, useMachine } from "@zag-js/vue"
import { computed, defineComponent } from "vue"
import { StateVisualizer } from "../components/state-visualizer"
import { useControls } from "../hooks/use-controls"

import { Toolbar } from "../components/toolbar"

const HalfStar = defineComponent({
  name: "HalfStar",
  setup() {
    return () => (
      <svg viewBox="0 0 273 260" data-part="star">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M135.977 214.086L52.1294 259.594L69.6031 165.229L0 99.1561L95.1465 86.614L135.977 1.04785V214.086Z"
          fill="currentColor"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M135.977 213.039L219.826 258.546L202.352 164.181L271.957 98.1082L176.808 85.5661L135.977 0V213.039Z"
          fill="#bdbdbd"
        />
      </svg>
    )
  },
})

const Star = defineComponent({
  name: "Star",
  setup() {
    return () => (
      <svg viewBox="0 0 273 260" data-part="star">
        <path
          d="M136.5 0L177.83 86.614L272.977 99.1561L203.374 165.229L220.847 259.594L136.5 213.815L52.1528 259.594L69.6265 165.229L0.0233917 99.1561L95.1699 86.614L136.5 0Z"
          fill="currentColor"
        />
      </svg>
    )
  },
})

export default defineComponent({
  name: "Rating",
  setup() {
    const controls = useControls(ratingControls)
    const [state, send] = useMachine(
      rating.machine({
        id: "rating",
        value: 2.5,
      }),
      {
        context: controls.context,
      },
    )

    const apiRef = computed(() => rating.connect(state.value, send, normalizeProps))

    return () => {
      const api = apiRef.value

      return (
        <>
          <main class="rating">
            <div {...api.rootProps}>
              <div {...api.controlProps}>
                {api.sizeArray.map((index) => {
                  const state = api.getRatingState({ index })
                  return (
                    <span key={index} {...api.getRatingProps({ index })}>
                      {state.isHalf ? <HalfStar /> : <Star />}
                    </span>
                  )
                })}
              </div>
              <input {...api.hiddenInputProps} data-testid="hidden-input" />
            </div>
          </main>

          <Toolbar controls={controls.ui}>
            <StateVisualizer state={state} />
          </Toolbar>
        </>
      )
    }
  },
})
