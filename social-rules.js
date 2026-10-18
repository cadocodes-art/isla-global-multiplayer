/* Shared hints for the composer. The server runs the same checks before storing messages. */
(function(root){
 'use strict';
 const messageReasons=['Scam / phishing','Inappropriate content','Bullying / harassment','Other'];
 const mapReasons=['Bullying / harassment','Inappropriate content','Stolen content','Other'];
 function messageError(value){
  if(typeof value!=='string'||!value.trim()||value.length>500)return 'Use between 1 and 500 characters.';
  const s=value.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g,'').toLowerCase();
  const dots=s.replace(/\s*(?:\[dot\]|\(dot\)|\{dot\}|\bdot\b)\s*/g,'.').replace(/[。．]/g,'.');
  const compact=dots.replace(/\s+/g,'');
  if(/(?:https?|hxxps?|ftp|file|mailto|javascript|data|discord|steam):|www\s*[.。]|(?:https?|hxxps?)\s*[:/]\s*\/?\/?/i.test(s)
   ||/[a-z\d][a-z\d-]*\.(?:[a-z]{2,63})(?:\b|\/)/i.test(dots)
   ||/(?:https?:|hxxps?:|www\.|[a-z\d-]+\.(?:com|net|org|io|gg|co|dev|app|xyz|me|info|site|link|uk|us|ca|edu|gov)(?:\b|\/))/i.test(compact)
   ||/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(dots)
   ||/[\w.+-]+\s*(?:@|\[at\]|\(at\))\s*[\w.-]+/i.test(s))return 'Message not sent: links, website-like text, and email addresses are not allowed.';
  const street='(?:street|st|road|rd|avenue|ave|av|boulevard|blvd|lane|ln|drive|dr|court|ct|circle|cir|way|place|pl|terrace|ter|trail|trl|highway|hwy|parkway|pkwy|crescent|close|mews|square|sq)';
  if(new RegExp('\\b\\d{1,6}[a-f]?(?:[-/]\\d{1,6})?\\s+(?:(?!(?:kph|mph|km|aura|seconds|meters|minutes|points|times|laps|cars)\\b)(?:[a-z0-9]+[.\u2019\x27-]?|[nsew])\\s+){0,7}'+street+'\\b','i').test(s)
   ||/\bp\s*\.?\s*o\s*\.?\s*box\s*\d+|\bpost\s+office\s+box\s*\d+/i.test(s)
   ||/\b(?:address|apt|apartment|suite|unit)\s*(?:is|:|#)?\s*\d+[a-z]?\b/i.test(s)
   ||/\b\d{1,3}\.\d{3,}\s*[,;]\s*-?\d{1,3}\.\d{3,}\b/.test(s)
   ||/\b[a-z]{1,2}\d[a-z\d]?\s+\d[a-z]{2}\b|\b[a-z]\d[a-z]\s*\d[a-z]\d\b/i.test(s)
   ||/\b(?:rue|calle|avenida|strasse|straße)\s+[a-z\s]{1,40}\s+\d{1,6}\b/i.test(s))return 'Message not sent: this looks like a street address or location. Remove that part and try again.';
  return '';
 }
 const api={messageError,messageReasons,mapReasons,postLimit:150,messageLimit:500};
 root.IslaSocialRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
