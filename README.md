# kmlamap
导入 kml 文件并绘制到高德地图

```
        var map = new AMap.Map('container',{
            resizeEnable: true,
            zoom: 14,
            center: [119.8281, 30.6069]
        });
        var kmlamap = new KmlAmap(map)
        kmlamap.addKmlLayer(`URL_OF_KMLFILE`)
```
