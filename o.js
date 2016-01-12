var pipette = require('pipette')
  , Blip = pipette.Blip
 
var fs = require('fs')
  , odt = require('./index')
  , _ = require("lodash")
  , template = odt.template
  , createWriteStream = fs.createWriteStream
  , xml = require("xmldom")
  , qr = require("qr-image")

var doc = '/home/mdamt/test.ott';
var values = {
  'subject': { type: 'string', value: 'My subject value' }
};

// apply values

var imageName;
var filter = function (name, data, done) {
  if (name == "styles") {
    var nodes = data.getElementsByTagName("draw:frame");
    _.each(nodes, function(item) {
      var attrs = item.attributes;
      _.each(attrs, function(attr) {
        if (attr.nodeName == "draw:name" && attr.nodeValue == "QR") {
          var image = data.createElement("draw:image");
          image.setAttribute("xlink:href", "Pictures/qrcode.png");
          image.setAttribute("xlink:type", "simple");
          image.setAttribute("xlink:show", "embed");
          image.setAttribute("xlink:actuate", "onLoad");

          _.each(item.childNodes, function(node) {
            item.removeChild(node);
          });

          item.appendChild(image);
        }
      })
    });
    done(null, new Blip(data.toString()));
  } else {
    done();
  }
}

var filterManifest = function (name, data, done) {
  if (name == "manifest") {
    var nodes = data.getElementsByTagName("manifest:manifest");
    _.each(nodes, function(item) {
  console.log(item);
        var entry = data.createElement("manifest:file-entry");
        entry.setAttribute("manifest:full-path", "Pictures/qrcode.png");
        entry.setAttribute("manifest:media-type", "image/png");
        item.appendChild(entry);
    })
        console.log(data.toString())
    done(null, new Blip(data.toString()));
  } else {
    done();
  }
}


var t = template(doc)
  t.apply(filter)
  t.apply(filterManifest)
  .apply(values)

  t.on('error', function(err){
    throw err;
  })
  .on('end', function(doc){

    // write archive to disk.


    doc.pipe(createWriteStream('mydocument.odt'))
    doc.finalize(function(err){
      if (err) throw err;
      console.log('document written!');
    });
  });

  var qrStream = qr.image("http://olala", {size: 10});
  qrStream.on("data", function(d) {
    console.log(d.length);
  });
  var qrCode = t.append({
    name: "Pictures/qrcode.png",
    zlib: { level: 1}
  });
  qrCode(qrStream,function() {console.log("oo")});


