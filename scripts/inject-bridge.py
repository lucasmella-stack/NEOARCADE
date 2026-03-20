#!/usr/bin/env python3
"""
Injects the NEOARCADE joystick → keyboard bridge into Pygbag's built index.html.

Usage: python scripts/inject-bridge.py <path/to/index.html>

Pygbag controls (Street Fighter):
  left  → A key  (move left)
  right → D key  (move right)
  up    → W key  (jump)
  a     → R key  (close range attack)
  b     → T key  (long range attack)
  start → auto-click START GAME on first frame
"""

import sys
from pathlib import Path

BRIDGE = """
<!-- NEOARCADE Joystick Bridge — injected at build time -->
<script>
(function () {
  var MAP = { left: 97, right: 100, up: 119, down: 115, a: 114, b: 116, y: 121 };
  // a=97 d=100 w=119 s=115 r=114 t=116 y=121

  function fireKey(type, code) {
    var opts = {
      key: String.fromCharCode(code),
      keyCode: code,
      which: code,
      charCode: code,
      bubbles: true,
      cancelable: true,
    };
    document.dispatchEvent(new KeyboardEvent(type, opts));
  }

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "neoarcade-input") return;
    var code = MAP[d.button];
    if (!code) return;
    fireKey(d.state === "pressed" ? "keydown" : "keyup", code);
  });
})();
</script>
"""


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python inject-bridge.py <index.html>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    content = path.read_text(encoding="utf-8")

    if "neoarcade-input" in content:
        print("Bridge already injected, skipping.")
        return

    if "</body>" not in content:
        print("WARNING: </body> not found, appending bridge at end.")
        content += BRIDGE
    else:
        content = content.replace("</body>", BRIDGE + "</body>", 1)

    path.write_text(content, encoding="utf-8")
    print(f"Bridge injected successfully into {path}")


if __name__ == "__main__":
    main()
