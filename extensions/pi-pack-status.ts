import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("pi-pack-status", {
    description: "Show that the pi-pack extension is loaded",
    handler: async (_args, ctx) => {
      const lines = [
        `cwd: ${ctx.cwd}`,
        `settings: ${ctx.sessionManager.getSessionFile() ?? "session active"}`,
        "pi-pack extension loaded",
      ];
      ctx.ui.notify("pi-pack is active", "success");
      ctx.ui.setWidget("pi-pack", lines);
    },
  });
}
