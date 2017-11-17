// Copied from https://github.com/wooorm/strip-markdown
// Modified to include code snippets as a paragraph
// And show link urls after the link text

module.exports = strip;

function strip() {
  return one;
}

/* Expose modifiers for available node types.
 * Node types not listed here are not changed
 * (but their children are). */
var map = {};

map.heading = paragraph;
map.text = text;
map.inlineCode = text;
map.image = image;
map.imageReference = image;
map.break = lineBreak;

map.blockquote = children;
map.list = children;
map.listItem = children;
map.strong = children;
map.emphasis = children;
map.delete = children;
map.link = link;
map.linkReference = children;

map.code = text;
map.horizontalRule = empty;
map.thematicBreak = empty;
map.html = empty;
map.table = empty;
map.tableCell = empty;
map.definition = empty;
map.yaml = empty;

/* One node. */
function one(node) {
  var type = node && node.type;

  if (type in map) {
    node = map[type](node);
  }

  if ('length' in node) {
    node = all(node);
  }

  if (node.children) {
    node.children = all(node.children);
  }

  return node;
}

/* Multiple nodes. */
function all(nodes) {
  var index = -1;
  var length = nodes.length;
  var result = [];
  var value;

  while (++index < length) {
    value = one(nodes[index]);

    if (value && typeof value.length === 'number') {
      result = result.concat(value.map(one));
    } else {
      result.push(value);
    }
  }

  return clean(result);
}

/* Clean nodes: merges text's. */
function clean(values) {
  var index = -1;
  var length = values.length;
  var result = [];
  var prev = null;
  var value;

  while (++index < length) {
    value = values[index];

    if (prev && 'value' in value && value.type === prev.type) {
      prev.value += value.value;
    } else {
      result.push(value);
      prev = value;
    }
  }

  return result;
}

/* Return an stringified image. */
function image(token) {
  return {
    type: 'text',
    value: token.alt || token.title || ''
  };
}

/* Return `token`s value. */
function text(token) {
  return {type: 'text', value: token.value};
}

/* Return a paragraph. */
function paragraph(token) {
  return {type: 'paragraph', children: token.children};
}

/* Return the concatenation of `token`s children. */
function children(token) {
  return token.children;
}

function link(token) {
  let linkText = token.children[0].value;
  if (linkText.match(/https?:\/\//)) {
    return token.children;
  } else {
    return { type: 'text', value: token.children[0].value + ' (' + token.url + ') ' };
  }
}

/* Return line break. */
function lineBreak() {
  return {type: 'text', value: '\n'};
}

/* Return nothing. */
function empty() {
  return {type: 'text', value: ''};
}
