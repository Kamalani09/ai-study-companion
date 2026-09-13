if (typeof global !== "undefined" && typeof global.DOMMatrix === "undefined") {
  global.DOMMatrix = class DOMMatrix {};
}
const pdfParse = require("pdf-parse");
const fs = require("fs");

console.log("Success!");
