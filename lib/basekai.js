/*
  A javascript library for converting BigNumber to kai notation
*/
var BN = require('bignumber.js');

var FROM_KAI_MAP = {
  '1': '0',
  '2': '1',
  '3': '2',
  '4': '3',
  '5': '4',
  '6': '5',
  '7': '6',
  '8': '7',
  '9': '8',
  'a': '9',
  'b': 'a',
  'c': 'b',
  'd': 'c',
  'e': 'd',
  'f': 'e',
  'g': 'f',
  'h': 'g',
  'i': 'h',
  'j': 'i',
  'k': 'j',
  'm': 'k',
  'n': 'l',
  'o': 'm',
  'p': 'n',
  'q': 'o',
  'r': 'p',
  's': 'q',
  't': 'r',
  'u': 's',
  'v': 't',
  'w': 'u',
  'x': 'v'
}

var TO_KAI_MAP = {
  '0': '1',
  '1': '2',
  '2': '3',
  '3': '4',
  '4': '5',
  '5': '6',
  '6': '7',
  '7': '8',
  '8': '9',
  '9': 'a',
  'a': 'b',
  'b': 'c',
  'c': 'd',
  'd': 'e',
  'e': 'f',
  'f': 'g',
  'g': 'h',
  'h': 'i',
  'i': 'j',
  'j': 'k',
  'k': 'm',
  'l': 'n',
  'm': 'o',
  'n': 'p',
  'o': 'q',
  'p': 'r',
  'q': 's',
  'r': 't',
  's': 'u',
  't': 'v',
  'u': 'w',
  'v': 'x'
}

function encode(bignumber) {
  const input = bignumber.toString(32);
  let encoded = '';
  for (var i = 0; i < input.length; i++) {
    if (TO_KAI_MAP[input[i]] == undefined) {
      throw new Error("invalid input: ", input[i]);
    }
    encoded = encoded.concat(TO_KAI_MAP[input[i]]);
  }
  return encoded;
}

function decode(kai) {
  const input = kai;
  let decoded = '';
  for (var i = 0; i < input.length; i++) {
    if (FROM_KAI_MAP[input[i]] == undefined) {
      throw new Error("invalid input: ", input[i]);
    }
    decoded = decoded.concat(FROM_KAI_MAP[input[i]]);
  }
  return new BN(decoded, 32);
}

exports.encode = encode;
exports.decode = decode;
