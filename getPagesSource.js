chrome.runtime.sendMessage({
  action: "getSource",
  source: DOMtoString(document)
});

function DOMtoString(document_root) {
  // console.log(window.location.href)
  var html = '';
  var node = document_root.firstChild;
  while (node) {
    switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      html += node.outerHTML;
      break;
    case Node.TEXT_NODE:
      html += node.nodeValue;
      break;
    case Node.CDATA_SECTION_NODE:
      html += '<![CDATA[' + node.nodeValue + ']]>';
      break;
    case Node.COMMENT_NODE:
      html += '<!--' + node.nodeValue + '-->';
      break;
    case Node.DOCUMENT_TYPE_NODE:
      // (X)HTML documents are identified by public identifiers
      html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
      break;
    }
    node = node.nextSibling;
  }
  return StorePath(html);
}

function matchReg(str, reg, res) {
  var strMatchRes = str.match(reg);
  if (strMatchRes != null) {
    for (var i = 0; i < strMatchRes.length; i++) {
      res.push(strMatchRes[i]);
    }
  }
  return res
}

function StorePath(html) {
  var textReg = /(http:\/\/www\.itextbook\.cn)?\/batch\/[0-9]{8}.*?(.jpg)/gi;
  var researchReg = /(https:\/\/www\.iresearchbook\.cn)?\/img\/[\/]?[0-9]{18}.*?(.jpg)/gi;
  var matchRes = [];
  matchRes = matchReg(html, textReg, matchRes);
  matchRes = matchReg(html, researchReg, matchRes);

  // var storePathReg = /(?<="storePath":"\\).*?(.cdf|.epub)/gi;
  // var storePathMatch = html.match(storePathReg);
  // if (storePathMatch != null){
  //     var storePath = storePathMatch[0].replace('\\', '')
  //     var storePathUrl= storePath.split('.')[0]
  //     var storePathType = storePath.split('.')[1]
  // }

  resReg = /(\/batch|\/img)\/[\/]?.*?(?=.jpg)/i;

  if (matchRes != null) {
    var res = [];
    for (var i = 0; i < matchRes.length; i++) {
      res.push(matchRes[i].match(resReg)[0])
    };

    // var resType = []
    // for (var j=0; j<res.length; j++){
    //     resType.push("cdf")
    // }
    // console.log(resType)

    return res
  } else {
    return '0';
  }
}