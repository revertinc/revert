import { MatchDecorator, ViewPlugin, Decoration } from "@codemirror/view";
import "./codeMirror.css";

let bracesDeco = Decoration.mark({ class: "braces" }); // adds a className to the text that matches the regex.
let decorator = new MatchDecorator({
  regexp: /\{\{.*?\}\}/gi,
  decoration: (m) => bracesDeco,
});

export const evalHightlighterPlugin = ViewPlugin.define(
  (view) => ({
    decorations: decorator.createDeco(view),
    update(u) {
      this.decorations = decorator.updateDeco(u, this.decorations);
    },
  }),
  {
    decorations: (v) => v.decorations,
  }
);
