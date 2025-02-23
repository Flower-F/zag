import { createMachine, guards, ref } from "@zag-js/core"
import { raf } from "@zag-js/dom-query"
import { compact } from "@zag-js/utils"
import { dom } from "./file-upload.dom"
import type { MachineContext, MachineState, UserDefinedContext } from "./file-upload.types"
import { getAcceptAttrString, getFilesFromEvent, isFilesWithinRange } from "./file-upload.utils"

const { not } = guards

export function machine(userContext: UserDefinedContext) {
  const ctx = compact(userContext)
  return createMachine<MachineContext, MachineState>(
    {
      id: "fileupload",
      initial: "idle",
      context: {
        minFileSize: 0,
        maxFileSize: Infinity,
        maxFiles: 1,
        allowDrop: true,
        ...ctx,
        files: ref(ctx.files ?? []),
        rejectedFiles: ref([]),
        invalid: false,
      },
      computed: {
        acceptAttr: (ctx) => getAcceptAttrString(ctx.accept),
        multiple: (ctx) => ctx.maxFiles > 1,
      },
      on: {
        "FILES.SET": {
          actions: ["setFilesFromEvent", "invokeOnChange"],
        },
        "FILE.DELETE": {
          actions: ["removeFile", "invokeOnChange"],
        },
      },
      states: {
        idle: {
          on: {
            OPEN: "open",
            "DROPZONE.CLICK": "open",
            "DROPZONE.FOCUS": "focused",
            "DROPZONE.DRAG_OVER": [
              {
                guard: not("isWithinRange"),
                target: "dragging",
                actions: ["setInvalid"],
              },
              { target: "dragging" },
            ],
          },
        },
        focused: {
          on: {
            OPEN: "open",
            "DROPZONE.CLICK": "open",
            "DROPZONE.ENTER": "open",
            "DROPZONE.BLUR": "idle",
          },
        },
        dragging: {
          on: {
            "DROPZONE.DROP": {
              target: "idle",
              actions: ["clearInvalid", "setFilesFromEvent", "invokeOnChange"],
            },
            "DROPZONE.DRAG_LEAVE": {
              target: "idle",
              actions: ["clearInvalid"],
            },
          },
        },
        open: {
          activities: ["trackWindowFocus"],
          entry: ["openFilePicker"],
          on: {
            CLOSE: "idle",
          },
        },
      },
    },
    {
      guards: {
        isWithinRange: (ctx, evt) => isFilesWithinRange(ctx, evt.count),
      },
      activities: {
        trackWindowFocus(ctx, _evt, { send }) {
          const win = dom.getWin(ctx)
          const onWindowFocus = () => {
            raf(() => send("CLOSE"))
          }
          win.addEventListener("focus", onWindowFocus)
          return () => win.removeEventListener("focus", onWindowFocus)
        },
      },
      actions: {
        openFilePicker(ctx) {
          raf(() => {
            dom.getHiddenInputEl(ctx)?.click()
          })
        },
        setInvalid(ctx) {
          ctx.invalid = true
        },
        clearInvalid(ctx) {
          ctx.invalid = false
        },
        setFilesFromEvent(ctx, evt) {
          const result = getFilesFromEvent(ctx, evt.files)
          const { acceptedFiles, rejectedFiles } = result

          ctx.rejectedFiles = ref(rejectedFiles)

          if (ctx.multiple) {
            ctx.files = ref([...ctx.files, ...acceptedFiles])
            return
          }

          if (acceptedFiles.length) {
            ctx.files = ref([acceptedFiles[0]])
          }
        },
        removeFile(ctx, evt) {
          const nextFiles = ctx.files.filter((file) => file !== evt.file)
          ctx.files = ref(nextFiles)
        },
        invokeOnChange(ctx) {
          ctx.onChange?.({
            acceptedFiles: ctx.files,
            rejectedFiles: ctx.rejectedFiles,
          })
        },
      },
      compareFns: {
        files: (a, b) => a.length === b.length && a.every((file, i) => file === b[i]),
      },
    },
  )
}
