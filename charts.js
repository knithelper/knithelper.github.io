const localStorageKey = 'knithelper-chart-pattern'
const defaultPattern = {
  "title": "",
  "font": "Arial",
  "cell-size": 15,
  "cols": 30,
  "rows": 20,
  "styles": [
    {"color": "#c12", "frame": "#8a2"},
    {"color": "#c12", "mark": "/"},
    {"color": "#c12", "mark": "\\"},
    {"color": "#c12", "mark": "^"},
    {"mark": "dot"},
    {"color": "#999"}
  ],
  "cells": []
}
const sanitize = p => {
  if (!p['title']) p['title'] = ''
  p['title'] += ''
  if (!p['font']) p['font'] = 'Arial'
  p['font'] += ''
  p['cell-size'] |= 0
  if (p['cell-size'] < 1) p['cell-size'] = 15
  p['cols'] |= 0
  if (p['cols'] < 1) p['cols'] = 30
  p['rows'] |= 0
  if (p['rows'] < 1) p['rows'] = 20
  const cells = []
  for (let r = 0; r < p['rows']; ++r) {
    if (!Array.isArray(p['cells'][r])) {
      p['cells'][r] = []
    }
    cells[r] = []
    for (let c = 0; c < p['cols']; ++c) {
      cells[r][c] = p['cells'][r][c] | 0
    }
  }
  p['cells'] = cells
  return p
}

const htmlEscape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const loadPattern = () => {
  try {
    return sanitize(JSON.parse(localStorage.getItem(localStorageKey)))
  } catch (e) {
    return sanitize(defaultPattern)
  }
}

const renderCell = (x, y, style, cellSize) => {
  let svg = ''
  if (style['color']) {
    svg += '<path d="m' + x + ' ' + y + 'h' + cellSize + 'v' + cellSize + 'h-' + cellSize + 'z" style="fill:' + htmlEscape(style['color']) + ';"/>\n'
  }
  if (style['frame']) {
    svg += '<path d="m' + (x + 1.5) + ' ' + (y + 1.5) + 'h' + (cellSize - 3) + 'v' + (cellSize - 3) + 'h' + (-cellSize + 3) + 'z" style="stroke:' + htmlEscape(style['frame']) + ';stroke-width:2px;stroke-linejoin:miter;"/>\n'
  }
  if (style['mark'] === '/') {
    svg += '<path d="m' + x + ' ' + (y + cellSize) + 'l' + cellSize + '-' + cellSize + '" style="stroke:#000;"/>\n'
  } else if (style['mark'] === '\\') {
    svg += '<path d="m' + x + ' ' + y + 'l' + cellSize + ' ' + cellSize + '" style="stroke:#000;"/>\n'
  } else if (style['mark'] === '^') {
    svg += '<path d="m' + x + ' ' + (y + cellSize) + 'l' + (cellSize / 2) + '-' + cellSize + 'l' + (cellSize / 2) + ' ' + cellSize + '" style="stroke: #000;"/>\n'
  } else if (style['mark'] === 'dot') {
    svg += '<circle cx="' + (x + cellSize / 2) + '" cy="' + (y + cellSize / 2) + '" r="' + (cellSize / 5) + '" style="fill:#000;"/>\n'
  } else if (style['mark']) {
    svg += '<text style="fill:currentcolor;font-size:10px;" x="' + (x + cellSize / 2) + '" y="' + (y + cellSize / 2 + 3) + '" text-anchor="middle">' + htmlEscape(style['mark']) + '</text>\n'
  }
  return svg
}
const render = pattern => {
  const cellSize = pattern['cell-size']
  let padding = 3 * cellSize + 0.5
  let text = true
  if (pattern['no-text']) {
    padding = 0.5
    text = false
  }
  let svg = ''
  let cols = pattern['cols']
  let rows = pattern['rows']
  let w = cols * cellSize
  let h = rows * cellSize
  svg += '<svg xmlns="http://www.w3.org/2000/svg" width="' + (w + 2 * padding) + '" height="' + (h + 2 * padding) + '" viewBox="0 0 ' + (w + 2 * padding) + ' ' + (h + 2 * padding) + '">\n'
  svg += '<g style="stroke:none;fill:none;stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;font-family:\'' + htmlEscape(pattern['font']) + '\',sans-serif;">'
  svg += '<g>\n'
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      let s = pattern['cells'][r][c]
      if (s > 0 && s <= pattern['styles'].length) {
        let style = pattern['styles'][s - 1]
        let x = padding + c * cellSize
        let y = padding + r * cellSize
        svg += renderCell(x, y, style, cellSize)
      }
    }
  }
  svg += '</g>\n'
  svg += '<g style="stroke:currentcolor;stroke-linejoin:miter;">\n'
  for (let x = padding + cellSize; x <= (cols - 1) * cellSize + padding; x += cellSize) {
    svg += '<path d="m' + x + ' ' + padding + 'v' + h + '"/>\n'
  }
  for (let y = padding + cellSize; y <= (rows - 1) * cellSize + padding; y += cellSize) {
    svg += '<path d="m' + padding + ' ' + y + 'h' + w + '"/>\n'
  }
  svg += '<path d="m' + padding + ' ' + padding + 'h' + w + 'v' + h + 'h-' + w + 'z"/>\n'
  svg += '</g>\n'
  svg += '<g style="fill:currentcolor;font-size:10px;">\n'
  for (let i = 0; i < rows; ++i) {
    let x = padding + w + 4
    let y = padding + (i + 0.5) * cellSize + 3
    if (text) svg += '<text x="' + x + '" y="' + y + '">' + (rows - i) + '</text>\n'
  }
  for (let i = 0; i < cols; ++i) {
    let x = padding + (i + 0.5) * cellSize + 3
    let y = padding + h + 4
    if (text) svg += '<text x="' + x + '" y="' + y + '" transform="rotate(-90 ' + x + ',' + y + ')" text-anchor="end">' + (cols - i) + '</text>\n'
  }
  svg += '</g>\n'
  if (pattern['title'] != '') {
    if (text) svg += '<text style="fill:currentcolor;font-size:15px;font-weight:bold;" x="' + (padding + w / 2) + '" y="' + (padding - 7) + '" text-anchor="middle">' + htmlEscape(pattern['title']) + '</text>\n'
  }
  svg += '</g>\n'
  svg += '</svg>'
  return svg
}
const renderLegend = pattern => {
  const cellSize = pattern['cell-size']
  let padding = 3 * cellSize + 0.5
  let text = true
  if (pattern['no-text']) {
    padding = 0.5
    text = false
  }
  let numStyles = 0
  for (let i = 0; i < pattern['styles'].length; ++i) {
    if (pattern['styles'][i]['legend']) {
      numStyles += 1
    }
  }
  let legend = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (2 * padding + 100) + '" height="' + ((numStyles * 1.5 - 0.5) * cellSize + 2 * padding) + '">'
  legend += '<style type="text/css">'
  legend += "*{stroke:none;fill:none;stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;font-family:'" + htmlEscape(pattern['font']) + "',sans-serif;}"
  legend += "text{fill:#000;}"
  legend += '</style>'
  if (text) legend += '<text style="font-size:15px;font-weight:bold;" x="' + padding + '" y="' + (padding - 7) + '">Legend</text>'
  let ypos = padding
  for (let i = 0; i < pattern['styles'].length; ++i) {
    if (pattern['styles'][i]['legend']) {
      legend += renderCell(padding, ypos, pattern['styles'][i], cellSize)
      legend += '<path d="m' + padding + ' ' + ypos + 'h' + cellSize + 'v' + cellSize + 'h-' + cellSize + 'z" style="stroke:#000;"/>'
      legend += '<text style="font-size:10px;" x="' + (padding + cellSize + 4) + '" y="' + (ypos + cellSize / 2 + 3) + '">' + htmlEscape(pattern['styles'][i]['legend']) + '</text>'
      ypos += 1.5 * cellSize
    }
  }
  legend += '</svg>'
  return legend
}

const downloadString = (text, fileType, fileName) => {
  const blob = new Blob([text], { type: fileType })
  const a = document.createElement('a')
  a.download = fileName
  a.href = URL.createObjectURL(blob)
  a.dataset.downloadurl = [fileType, a.download, a.href].join(':')
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(a.href), 1500)
}

const app = Vue.createApp({
  data() {
    return {
      down: false,
      style: 0,
      pattern: loadPattern()
    }
  },
  computed: {
    svg() {
      return render(this.pattern)
    },
    legend() {
      return renderLegend(this.pattern)
    },
    json() {
      return JSON.stringify(this.pattern)
    }
  },
  methods: {
    encodeSvg(svg) {
      return 'data:image/svg+xml;charset=utf-8;base64,' + btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    },
    mousedown(ev) {
      this.down = true
      let cellSize = this.pattern['cell-size']
      let padding = 3 * cellSize
      let x = Math.floor((ev.offsetX - padding) / cellSize)
      let y = Math.floor((ev.offsetY - padding) / cellSize)
      if (x >= 0 && x < this.pattern['cols'] && y >= 0 && y < this.pattern['rows']) {
        this.pattern['cells'][y][x] = this.style
      }
    },
    mousemove(ev) {
      if (this.down) {
        let cellSize = this.pattern['cell-size']
        let padding = 3 * cellSize
        let x = Math.floor((ev.offsetX - padding) / cellSize)
        let y = Math.floor((ev.offsetY - padding) / cellSize)
        if (x >= 0 && x < this.pattern['cols'] && y >= 0 && y < this.pattern['rows']) {
          this.pattern['cells'][y][x] = this.style
        }
      }
    },
    fill() {
      for (let r = 0; r < this.pattern['rows']; ++r) {
        for (let c = 0; c < this.pattern['cols']; ++c) {
          this.pattern['cells'][r][c] = this.style
        }
      }
    },
    mirrorRL() {
      for (let r = 0; r < this.pattern['rows']; ++r) {
        for (let c = 0; c < (this.pattern['cols'] - 1) / 2; ++c) {
          let t = this.pattern['cells'][r][c]
          this.pattern['cells'][r][c] = this.pattern['cells'][r][this.pattern['cols'] - c - 1]
          this.pattern['cells'][r][this.pattern['cols'] - c - 1] = t
        }
      }
    },
    rotateLeft() {
      const rows = this.pattern.rows
      const cols = this.pattern.cols
      const cells = []
      for (let r = 0; r < cols; ++r) {
        cells[r] = []
      }
      for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
          cells[c][r] = this.pattern.cells[r][cols - 1 - c]
        }
      }
      this.pattern.cells = cells
      this.pattern.rows = cols
      this.pattern.cols = rows
    },
    rotateRight() {
      const rows = this.pattern.rows
      const cols = this.pattern.cols
      const cells = []
      for (let r = 0; r < cols; ++r) {
        cells[r] = []
      }
      for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
          cells[c][r] = this.pattern.cells[rows - 1 - r][c]
        }
      }
      this.pattern.cells = cells
      this.pattern.rows = cols
      this.pattern.cols = rows
    },
    removeTop() {
      if (this.pattern.rows < 2) return
      this.pattern.cells.shift()
      this.pattern.rows -= 1
    },
    addTop() {
      this.pattern.cells.unshift(Array(this.pattern.cols).fill(0))
      this.pattern.rows += 1
    },
    removeBottom() {
      if (this.pattern.rows < 2) return
      this.pattern.cells.pop()
      this.pattern.rows -= 1
    },
    addBottom() {
      this.pattern.cells.push(Array(this.pattern.cols).fill(0))
      this.pattern.rows += 1
    },
    removeLeft() {
      if (this.pattern.cols < 2) return
      for (let i = 0; i < this.pattern.rows; ++i) {
        this.pattern.cells[i].shift()
      }
      this.pattern.cols -= 1
    },
    addLeft() {
      for (let i = 0; i < this.pattern.rows; ++i) {
        this.pattern.cells[i].unshift(0)
      }
      this.pattern.cols += 1
    },
    removeRight() {
      if (this.pattern.cols < 2) return
      for (let i = 0; i < this.pattern.rows; ++i) {
        this.pattern.cells[i].pop()
      }
      this.pattern.cols -= 1
    },
    addRight() {
      for (let i = 0; i < this.pattern.rows; ++i) {
        this.pattern.cells[i].push(0)
      }
      this.pattern.cols += 1
    },
    addStyle() {
      this.pattern.styles.push({})
    },
    removeStyle(i) {
      this.pattern.styles.splice(i, 1)
      for (let r = 0; r < this.pattern.rows; ++r) {
        for (let c = 0; c < this.pattern.cols; ++c) {
          if (this.pattern.cells[r][c] === i + 1) {
            this.pattern.cells[r][c] = 0
          } else if (this.pattern.cells[r][c] > i + 1) {
            this.pattern.cells[r][c] -= 1
          }
        }
      }
    },
    swapStyles(i, j) {
      const n = this.pattern.styles.length
      i |= 0
      j |= 0
      if (i < 0 || j < 0 || i >= n || j >= n) return
      let t = this.pattern.styles[i]
      this.pattern.styles[i] = this.pattern.styles[j]
      this.pattern.styles[j] = t
      for (let r = 0; r < this.pattern.rows; ++r) {
        for (let c = 0; c < this.pattern.cols; ++c) {
          if (this.pattern.cells[r][c] === i + 1) {
            this.pattern.cells[r][c] = j + 1
          } else if (this.pattern.cells[r][c] === j + 1) {
            this.pattern.cells[r][c] = i + 1
          }
        }
      }
    },
    downloadSvg() {
      downloadString(this.svg, 'image/svg+xml', 'chart.svg')
    },
    downloadLegend() {
      downloadString(this.legend, 'image/svg+xml', 'legend.svg')
    },
    downloadJson() {
      downloadString(this.json, 'text/json', 'chart.json')
    },
    loadJson() {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.addEventListener('input', e => {
        if (e.target.files.length === 1) {
          e.target.files[0].text().then(data => {
            try {
              this.pattern = sanitize(JSON.parse(data))
            } catch(e) {
              alert('Could not load JSON')
            }
          })
        }
      })
      input.click()
    }
  },
  watch: {
    json(n) {
      console.log('Saving')
      localStorage.setItem(localStorageKey, n)
    }
  },
  mounted() {
    window.addEventListener('mouseup', () => {
      this.down = false
    })
    window.addEventListener("keydown", ev => {
      if (/^[0-9]$/.test(ev.key)) {
        this.style = parseInt(ev.key)
      }
    })
  }
}).mount('body')
