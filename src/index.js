
require('es6-promise').polyfill();
require('isomorphic-fetch');
const transform = require('wgs2mars');

const parseXML = require('xml-parse-from-string')


function toObject(node) {
  if (node.childElementCount > 0) {
    let result = {}
    for (var i=0;i<node.children.length;i++) {
      let child = node.children[i];
      let key = child.tagName
      let value = toObject(child)
      result[key] = value
    }
    return result;
  } else {
    return node.innerHTML
  }
}

export default class KmlAmap {
  constructor(amap) {
    this.amap = amap
    this.lines = []
  }

  addKmlLayer(url) {
    return fetch(url).then(response => {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.text()
    }).then(text => {
      let doc = parseXML(text)
      let placemarks = doc.getElementsByTagName('Placemark')
      if (placemarks) {
        for (var i=0;i<placemarks.length;i++) {
          let p = placemarks[i];
          let lines = p.getElementsByTagName('LineString')
          if (lines) {
            for (var j=0;j<lines.length;j++) {
              let line = lines[j];
              this.drawLine(p, line, doc)
            }
          }
          let points = p.getElementsByTagName('Point')
          if (points && points[0]) {
            this.drawMark(p, points[0], doc)
          }
        }
      }
    })
  }
  getStyle(node,root) {
    let styleUrl = node.getElementsByTagName('styleUrl')
    if (styleUrl && styleUrl[0]) {
      let id = styleUrl[0].innerHTML.substring(1)
      let elem = root.getElementById(id)
      if (elem) {
        return this.getStyle(elem,root)
      }
    } else {
      return toObject(node)
    }
  }
  
  markerClick(e) {
    if(!this.infoWindow){
       this.infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, -30)});
    }
    this.infoWindow.setContent(e.target.content);
    this.infoWindow.open(map, e.target.getPosition());
  }

  drawMark(placemark, point,root) {
    let text = point.getElementsByTagName('coordinates')[0].innerHTML
    let [wgslng, wgslat] = text.split(',')
    let {lng, lat} = transform(parseFloat(wgslng), parseFloat(wgslat));
    let nameNode = placemark.getElementsByTagName('name')[0]

    if (nameNode) {
      var marker = new AMap.Marker({
        position: [lng, lat],
        map: this.amap
      });
      marker.content=nameNode.innerHTML
      marker.on('click', this.markerClick.bind(this));
    }
  }

  drawLine(placemark, line,root) {
    let style = this.getStyle(placemark,root)
    let text = line.getElementsByTagName('coordinates')[0].innerHTML
    let nameNode = placemark.getElementsByTagName('name')[0]
    let color = `#${style.LineStyle.color.substring(2)}`

    if (nameNode) {
      this.lines.push({
        name: nameNode.innerHTML,
        color
      })
    }

    if (text) {
      text = text.trim()
      let coordinates = text.split(' ').map(t => {
        let [wgslng, wgslat] = t.split(',')
        let {lng, lat} = transform(parseFloat(wgslng), parseFloat(wgslat));
        return [lng, lat]
      })
      var polyline = new AMap.Polyline({
        path: coordinates,          //设置线覆盖物路径
        strokeColor: color, //线颜色
        strokeOpacity: 1,       //线透明度
        strokeWeight: parseInt(style.LineStyle.width),        //线宽
        strokeStyle: "solid",   //线样式
      });
      polyline.setMap(this.amap);

    }
  }

}