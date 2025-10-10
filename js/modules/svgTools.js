const svgNS = "http://www.w3.org/2000/svg";

/**
 * Adds an SVG object to the class that can be rendered using renderSVG()
 * @param {*} id
 * @param {*} parent
 * @param {*} viewBox
 * @returns svgElem
 */
function createSVG(id, parent, viewBox) {
  const svgElem = document.createElementNS(svgNS, "svg");
  parent.appendChild(svgElem);
  svgElem.id = id;
  //Set SVG Attributes
  svgElem.setAttribute("viewBox", viewBox);
  return svgElem;
}

/**
 * Adds a Group to the Node
 */
function addGroup(node, groupClass)
{
  const newGroup = document.createElementNS(svgNS, "g");
  newGroup.setAttribute("class",groupClass);
  return node.appendChild(newGroup);
}

/**
 * Draws a Line
 */
function drawLine(node, x1, y1, x2, y2, lineClass) {
  const newLine = document.createElementNS(svgNS, "line");
  
  newLine.setAttribute("x1", x1);
  newLine.setAttribute("y1", y1);
  newLine.setAttribute("x2", x2);
  newLine.setAttribute("y2", y2);
  newLine.setAttribute("class",lineClass);
  //const styleStr = `stroke:${strokeCol};stroke-width:${strokeWidth}`;
  //newLine.setAttribute("style", styleStr);
  return node.appendChild(newLine);
}
/**
 * Adds a regular Rectangle
 */
function addRec(node, x, y, width, height, className) {
  const newRect = document.createElementNS(svgNS, "rect");
  newRect.setAttribute("x", x);
  newRect.setAttribute("y", y);
  newRect.setAttribute("width", width);
  newRect.setAttribute("height", height);
  newRect.classList.add(className);

  return node.appendChild(newRect);
}
/**
 * Adds a rectangle with rounded corners
 */
function addRecRd(node, x, y, width, height, rx, ry, className) {
  const newRect = document.createElementNS(svgNS, "rect");
  newRect.setAttribute("x", x);
  newRect.setAttribute("y", y);
  newRect.setAttribute("width", width);
  newRect.setAttribute("height", height);
  newRect.setAttribute("rx", rx);
  newRect.setAttribute("ry", ry);
  //newRect.setAttribute("fill", fillCol);

  newRect.classList.add(className);

  return node.appendChild(newRect);
}

function addCircFill(node, x, y, rad, className) {
  const newCirc = document.createElementNS(svgNS, "circle");
  newCirc.setAttribute("cx", x);
  newCirc.setAttribute("cy", y);
  newCirc.setAttribute("r", rad);
  //newCirc.setAttribute("fill", fillCol);
  //newCirc.setAttribute("fill-opacity", fillOpac);

  newCirc.classList.add(className);

  return node.appendChild(newCirc);
}

function addCircOutL(node, x, y, rad, className) {
  const newCirc = document.createElementNS(svgNS, "circle");
  newCirc.setAttribute("cx", x);
  newCirc.setAttribute("cy", y);
  newCirc.setAttribute("r", rad);
  newCirc.setAttribute("fill", "none");
  //newCirc.setAttribute("stroke", outLineCol);
  //newCirc.setAttribute("stroke-width", strokeW);
  newCirc.classList.add(className);
  return node.appendChild(newCirc);
}


/**
 * Adds Text to the SVG
 * @param {*} node
 * @param {*} x
 * @param {*} y
 * @param {*} txt
 * @param {*} fSize
 * @param {*} fillCol
 * @returns
 */
function addText(node, x = 0, y = 0, txt = "", cent = false, className = false) {
  const newText = document.createElementNS(svgNS, "text");

  newText.setAttribute("x", x);
  newText.setAttribute("y", y);
  if (cent){
    newText.setAttribute("text-anchor", "middle");
    newText.setAttribute("dominant-baseline", "middle");
  }
  if (className){
    newText.classList.add("svgTx");
    newText.classList.add(className);
  }

  const textNode = document.createTextNode(txt);
  newText.appendChild(textNode);

  return node.appendChild(newText);
}

/**
 * Creates a slice of a circle.
 * @param {*} node - The parent node to append the slice to.
 * @param {number} cx - The x-coordinate of the center of the circle.
 * @param {number} cy - The y-coordinate of the center of the circle.
 * @param {number} radius - The radius of the circle.
 * @param {number} startAngle - The start angle of the slice in degrees.
 * @param {number} endAngle - The end angle of the slice in degrees.
 * @param {string} className - The class name for the slice.
 * @returns {SVGElement} - The created slice element.
 */
function createSlice(node, cx, cy, radius, startAngle, endAngle, className) {
  const slice = document.createElementNS(svgNS, "path");
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  const sweepFlag = 1;

  const d = [
    `M ${cx} ${cy}`,
    `L ${cx + radius * Math.cos((startAngle * Math.PI) / 180)} ${cy + radius * Math.sin((startAngle * Math.PI) / 180)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${cx + radius * Math.cos((endAngle * Math.PI) / 180)} ${cy + radius * Math.sin((endAngle * Math.PI) / 180)}`,
    `L ${cx} ${cy}`,
    `Z`
  ].join(' ');

  slice.setAttribute("d", d);
  slice.classList.add(className);
  return node.appendChild(slice);
}


export { svgNS, createSVG, addGroup, drawLine, addRec, addRecRd, addCircFill, addCircOutL, addText, createSlice };
