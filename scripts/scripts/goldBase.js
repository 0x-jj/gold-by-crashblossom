(() => {
  const css = `html, body {
    background: black;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
#main-svg, #main-svg-old {
    height: 100%;
    width: auto;
    aspect-ratio: 6/8;
    position: absolute;
}
.prompt-container{
    position: absolute;
    background: #ffc512;
    width: 50ch;
    padding: 10px;
    padding-top: 0;
    font-family: Helvetica;
    font-weight: bold;
}
.prompt{
    border-style: solid;
    border-width: 3px;
    border-color: black;
    background: #ffc512;
    width: 75ch;
    font-family: Helvetica;
    font-weight: bold;
    width: 98%;
} `;
  const head = document.head;
  const style = document.createElement("style");

  head.appendChild(style);

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  const body = document.body;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 600 800");
  svg.setAttribute("width", "600");
  svg.setAttribute("height", "800");
  svg.setAttribute("preserveAspectRatio", "xMidYMin slice");
  svg.setAttribute("id", "main-svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  body.appendChild(svg);
})();
