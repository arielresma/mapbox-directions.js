module.exports = (function(){
  var d3 = {version: "3.3.13"}; // semver
var d3_arraySlice = [].slice,
    d3_array = function(list) { return d3_arraySlice.call(list); }; // conversion for NodeLists

var d3_document = document,
    d3_documentElement = d3_document.documentElement,
    d3_window = window;

// Redefine d3_array if the browser doesn’t support slice-based conversion.
try {
  d3_array(d3_documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = function(list) {
    var i = list.length, array = new Array(i);
    while (i--) array[i] = list[i];
    return array;
  };
}
var d3_subclass = {}.__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(object, prototype) {
  object.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(object, prototype) {
  for (var property in prototype) object[property] = prototype[property];
};

function d3_vendorSymbol(object, name) {
  if (name in object) return name;
  name = name.charAt(0).toUpperCase() + name.substring(1);
  for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
    var prefixName = d3_vendorPrefixes[i] + name;
    if (prefixName in object) return prefixName;
  }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];

function d3_selection(groups) {
  d3_subclass(groups, d3_selectionPrototype);
  return groups;
}

var d3_select = function(s, n) { return n.querySelector(s); },
    d3_selectAll = function(s, n) { return n.querySelectorAll(s); },
    d3_selectMatcher = d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")],
    d3_selectMatches = function(n, s) { return d3_selectMatcher.call(n, s); };

// Prefer Sizzle, if available.
if (typeof Sizzle === "function") {
  d3_select = function(s, n) { return Sizzle(s, n)[0] || null; };
  d3_selectAll = function(s, n) { return Sizzle.uniqueSort(Sizzle(s, n)); };
  d3_selectMatches = Sizzle.matchesSelector;
}

d3.selection = function() {
  return d3_selectionRoot;
};

var d3_selectionPrototype = d3.selection.prototype = [];


d3_selectionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      group,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(subnode = selector.call(node, node.__data__, i, j));
        if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selector(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_select(selector, this);
  };
}

d3_selectionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      node;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
        subgroup.parentNode = node;
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selectorAll(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_selectAll(selector, this);
  };
}
var d3_nsPrefix = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

d3.ns = {
  prefix: d3_nsPrefix,
  qualify: function(name) {
    var i = name.indexOf(":"),
        prefix = name;
    if (i >= 0) {
      prefix = name.substring(0, i);
      name = name.substring(i + 1);
    }
    return d3_nsPrefix.hasOwnProperty(prefix)
        ? {space: d3_nsPrefix[prefix], local: name}
        : name;
  }
};

d3_selectionPrototype.attr = function(name, value) {
  if (arguments.length < 2) {

    // For attr(string), return the attribute value for the first node.
    if (typeof name === "string") {
      var node = this.node();
      name = d3.ns.qualify(name);
      return name.local
          ? node.getAttributeNS(name.space, name.local)
          : node.getAttribute(name);
    }

    // For attr(object), the object specifies the names and values of the
    // attributes to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_attr(value, name[value]));
    return this;
  }

  return this.each(d3_selection_attr(name, value));
};

function d3_selection_attr(name, value) {
  name = d3.ns.qualify(name);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrConstant() {
    this.setAttribute(name, value);
  }
  function attrConstantNS() {
    this.setAttributeNS(name.space, name.local, value);
  }

  // For attr(string, function), evaluate the function for each element, and set
  // or remove the attribute as appropriate.
  function attrFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttribute(name);
    else this.setAttribute(name, x);
  }
  function attrFunctionNS() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttributeNS(name.space, name.local);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return value == null
      ? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
      ? (name.local ? attrFunctionNS : attrFunction)
      : (name.local ? attrConstantNS : attrConstant));
}
function d3_collapse(s) {
  return s.trim().replace(/\s+/g, " ");
}
d3.requote = function(s) {
  return s.replace(d3_requote_re, "\\$&");
};

var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

d3_selectionPrototype.classed = function(name, value) {
  if (arguments.length < 2) {

    // For classed(string), return true only if the first node has the specified
    // class or classes. Note that even if the browser supports DOMTokenList, it
    // probably doesn't support it on SVG elements (which can be animated).
    if (typeof name === "string") {
      var node = this.node(),
          n = (name = d3_selection_classes(name)).length,
          i = -1;
      if (value = node.classList) {
        while (++i < n) if (!value.contains(name[i])) return false;
      } else {
        value = node.getAttribute("class");
        while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
      }
      return true;
    }

    // For classed(object), the object specifies the names of classes to add or
    // remove. The values may be functions that are evaluated for each element.
    for (value in name) this.each(d3_selection_classed(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_classed(name, value));
};

function d3_selection_classedRe(name) {
  return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
}

function d3_selection_classes(name) {
  return name.trim().split(/^|\s+/);
}

// Multiple class names are allowed (e.g., "foo bar").
function d3_selection_classed(name, value) {
  name = d3_selection_classes(name).map(d3_selection_classedName);
  var n = name.length;

  function classedConstant() {
    var i = -1;
    while (++i < n) name[i](this, value);
  }

  // When the value is a function, the function is still evaluated only once per
  // element even if there are multiple class names.
  function classedFunction() {
    var i = -1, x = value.apply(this, arguments);
    while (++i < n) name[i](this, x);
  }

  return typeof value === "function"
      ? classedFunction
      : classedConstant;
}

function d3_selection_classedName(name) {
  var re = d3_selection_classedRe(name);
  return function(node, value) {
    if (c = node.classList) return value ? c.add(name) : c.remove(name);
    var c = node.getAttribute("class") || "";
    if (value) {
      re.lastIndex = 0;
      if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
    } else {
      node.setAttribute("class", d3_collapse(c.replace(re, " ")));
    }
  };
}

d3_selectionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
      return this;
    }

    // For style(string), return the computed style value for the first node.
    if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // Otherwise, a name, value and priority are specified, and handled as below.
  return this.each(d3_selection_style(name, value, priority));
};

function d3_selection_style(name, value, priority) {

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  function styleConstant() {
    this.style.setProperty(name, value, priority);
  }

  // For style(name, function) or style(name, function, priority), evaluate the
  // function for each element, and set or remove the style property as
  // appropriate. When setting, use the specified priority.
  function styleFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.style.removeProperty(name);
    else this.style.setProperty(name, x, priority);
  }

  return value == null
      ? styleNull : (typeof value === "function"
      ? styleFunction : styleConstant);
}

d3_selectionPrototype.property = function(name, value) {
  if (arguments.length < 2) {

    // For property(string), return the property value for the first node.
    if (typeof name === "string") return this.node()[name];

    // For property(object), the object specifies the names and values of the
    // properties to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_property(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_property(name, value));
};

function d3_selection_property(name, value) {

  // For property(name, null), remove the property with the specified name.
  function propertyNull() {
    delete this[name];
  }

  // For property(name, string), set the property with the specified name.
  function propertyConstant() {
    this[name] = value;
  }

  // For property(name, function), evaluate the function for each element, and
  // set or remove the property as appropriate.
  function propertyFunction() {
    var x = value.apply(this, arguments);
    if (x == null) delete this[name];
    else this[name] = x;
  }

  return value == null
      ? propertyNull : (typeof value === "function"
      ? propertyFunction : propertyConstant);
}

d3_selectionPrototype.text = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.textContent = v == null ? "" : v; } : value == null
      ? function() { this.textContent = ""; }
      : function() { this.textContent = value; })
      : this.node().textContent;
};

d3_selectionPrototype.html = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.innerHTML = v == null ? "" : v; } : value == null
      ? function() { this.innerHTML = ""; }
      : function() { this.innerHTML = value; })
      : this.node().innerHTML;
};

d3_selectionPrototype.append = function(name) {
  name = d3_selection_creator(name);
  return this.select(function() {
    return this.appendChild(name.apply(this, arguments));
  });
};

function d3_selection_creator(name) {
  return typeof name === "function" ? name
      : (name = d3.ns.qualify(name)).local ? function() { return this.ownerDocument.createElementNS(name.space, name.local); }
      : function() { return this.ownerDocument.createElementNS(this.namespaceURI, name); };
}

d3_selectionPrototype.insert = function(name, before) {
  name = d3_selection_creator(name);
  before = d3_selection_selector(before);
  return this.select(function() {
    return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
  });
};

// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
d3_selectionPrototype.remove = function() {
  return this.each(function() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  });
};
function d3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}

d3.map = function(object) {
  var map = new d3_Map;
  if (object instanceof d3_Map) object.forEach(function(key, value) { map.set(key, value); });
  else for (var key in object) map.set(key, object[key]);
  return map;
};

function d3_Map() {}

d3_class(d3_Map, {
  has: function(key) {
    return d3_map_prefix + key in this;
  },
  get: function(key) {
    return this[d3_map_prefix + key];
  },
  set: function(key, value) {
    return this[d3_map_prefix + key] = value;
  },
  remove: function(key) {
    key = d3_map_prefix + key;
    return key in this && delete this[key];
  },
  keys: function() {
    var keys = [];
    this.forEach(function(key) { keys.push(key); });
    return keys;
  },
  values: function() {
    var values = [];
    this.forEach(function(key, value) { values.push(value); });
    return values;
  },
  entries: function() {
    var entries = [];
    this.forEach(function(key, value) { entries.push({key: key, value: value}); });
    return entries;
  },
  forEach: function(f) {
    for (var key in this) {
      if (key.charCodeAt(0) === d3_map_prefixCode) {
        f.call(this, key.substring(1), this[key]);
      }
    }
  }
});

var d3_map_prefix = "\0", // prevent collision with built-ins
    d3_map_prefixCode = d3_map_prefix.charCodeAt(0);

d3_selectionPrototype.data = function(value, key) {
  var i = -1,
      n = this.length,
      group,
      node;

  // If no value is specified, return the first value.
  if (!arguments.length) {
    value = new Array(n = (group = this[0]).length);
    while (++i < n) {
      if (node = group[i]) {
        value[i] = node.__data__;
      }
    }
    return value;
  }

  function bind(group, groupData) {
    var i,
        n = group.length,
        m = groupData.length,
        n0 = Math.min(n, m),
        updateNodes = new Array(m),
        enterNodes = new Array(m),
        exitNodes = new Array(n),
        node,
        nodeData;

    if (key) {
      var nodeByKeyValue = new d3_Map,
          dataByKeyValue = new d3_Map,
          keyValues = [],
          keyValue;

      for (i = -1; ++i < n;) {
        keyValue = key.call(node = group[i], node.__data__, i);
        if (nodeByKeyValue.has(keyValue)) {
          exitNodes[i] = node; // duplicate selection key
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
        keyValues.push(keyValue);
      }

      for (i = -1; ++i < m;) {
        keyValue = key.call(groupData, nodeData = groupData[i], i);
        if (node = nodeByKeyValue.get(keyValue)) {
          updateNodes[i] = node;
          node.__data__ = nodeData;
        } else if (!dataByKeyValue.has(keyValue)) { // no duplicate data key
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
        dataByKeyValue.set(keyValue, nodeData);
        nodeByKeyValue.remove(keyValue);
      }

      for (i = -1; ++i < n;) {
        if (nodeByKeyValue.has(keyValues[i])) {
          exitNodes[i] = group[i];
        }
      }
    } else {
      for (i = -1; ++i < n0;) {
        node = group[i];
        nodeData = groupData[i];
        if (node) {
          node.__data__ = nodeData;
          updateNodes[i] = node;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
      }
      for (; i < m; ++i) {
        enterNodes[i] = d3_selection_dataNode(groupData[i]);
      }
      for (; i < n; ++i) {
        exitNodes[i] = group[i];
      }
    }

    enterNodes.update
        = updateNodes;

    enterNodes.parentNode
        = updateNodes.parentNode
        = exitNodes.parentNode
        = group.parentNode;

    enter.push(enterNodes);
    update.push(updateNodes);
    exit.push(exitNodes);
  }

  var enter = d3_selection_enter([]),
      update = d3_selection([]),
      exit = d3_selection([]);

  if (typeof value === "function") {
    while (++i < n) {
      bind(group = this[i], value.call(group, group.parentNode.__data__, i));
    }
  } else {
    while (++i < n) {
      bind(group = this[i], value);
    }
  }

  update.enter = function() { return enter; };
  update.exit = function() { return exit; };
  return update;
};

function d3_selection_dataNode(data) {
  return {__data__: data};
}

d3_selectionPrototype.datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.property("__data__");
};

d3_selectionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
        subgroup.push(node);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_filter(selector) {
  return function() {
    return d3_selectMatches(this, selector);
  };
}

d3_selectionPrototype.order = function() {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
};
d3.ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

d3_selectionPrototype.sort = function(comparator) {
  comparator = d3_selection_sortComparator.apply(this, arguments);
  for (var j = -1, m = this.length; ++j < m;) this[j].sort(comparator);
  return this.order();
};

function d3_selection_sortComparator(comparator) {
  if (!arguments.length) comparator = d3.ascending;
  return function(a, b) {
    return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
  };
}
function d3_noop() {}

d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i >= 0) {
    name = type.substring(i + 1);
    type = type.substring(0, i);
  }

  if (type) return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);

  if (arguments.length === 2) {
    if (listener == null) for (type in this) {
      if (this.hasOwnProperty(type)) this[type].on(name, null);
    }
    return this;
  }
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}

d3.event = null;

function d3_eventPreventDefault() {
  d3.event.preventDefault();
}

function d3_eventSource() {
  var e = d3.event, s;
  while (s = e.sourceEvent) e = s;
  return e;
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var dispatch = new d3_dispatch,
      i = 0,
      n = arguments.length;

  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}

d3_selectionPrototype.on = function(type, listener, capture) {
  var n = arguments.length;
  if (n < 3) {

    // For on(object) or on(object, boolean), the object specifies the event
    // types and listeners to add or remove. The optional boolean specifies
    // whether the listener captures events.
    if (typeof type !== "string") {
      if (n < 2) listener = false;
      for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
      return this;
    }

    // For on(string), return the listener for the first node.
    if (n < 2) return (n = this.node()["__on" + type]) && n._;

    // For on(string, function), use the default capture.
    capture = false;
  }

  // Otherwise, a type, listener and capture are specified, and handled as below.
  return this.each(d3_selection_on(type, listener, capture));
};

function d3_selection_on(type, listener, capture) {
  var name = "__on" + type,
      i = type.indexOf("."),
      wrap = d3_selection_onListener;

  if (i > 0) type = type.substring(0, i);
  var filter = d3_selection_onFilters.get(type);
  if (filter) type = filter, wrap = d3_selection_onFilter;

  function onRemove() {
    var l = this[name];
    if (l) {
      this.removeEventListener(type, l, l.$);
      delete this[name];
    }
  }

  function onAdd() {
    var l = wrap(listener, d3_array(arguments));
    onRemove.call(this);
    this.addEventListener(type, this[name] = l, l.$ = capture);
    l._ = listener;
  }

  function removeAll() {
    var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"),
        match;
    for (var name in this) {
      if (match = name.match(re)) {
        var l = this[name];
        this.removeEventListener(match[1], l, l.$);
        delete this[name];
      }
    }
  }

  return i
      ? listener ? onAdd : onRemove
      : listener ? d3_noop : removeAll;
}

var d3_selection_onFilters = d3.map({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
});

d3_selection_onFilters.forEach(function(k) {
  if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
});

function d3_selection_onListener(listener, argumentz) {
  return function(e) {
    var o = d3.event; // Events can be reentrant (e.g., focus).
    d3.event = e;
    argumentz[0] = this.__data__;
    try {
      listener.apply(this, argumentz);
    } finally {
      d3.event = o;
    }
  };
}

function d3_selection_onFilter(listener, argumentz) {
  var l = d3_selection_onListener(listener, argumentz);
  return function(e) {
    var target = this, related = e.relatedTarget;
    if (!related || (related !== target && !(related.compareDocumentPosition(target) & 8))) {
      l.call(target, e);
    }
  };
}

d3_selectionPrototype.each = function(callback) {
  return d3_selection_each(this, function(node, i, j) {
    callback.call(node, node.__data__, i, j);
  });
};

function d3_selection_each(groups, callback) {
  for (var j = 0, m = groups.length; j < m; j++) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
      if (node = group[i]) callback(node, i, j);
    }
  }
  return groups;
}

d3_selectionPrototype.call = function(callback) {
  var args = d3_array(arguments);
  callback.apply(args[0] = this, args);
  return this;
};

d3_selectionPrototype.empty = function() {
  return !this.node();
};

d3_selectionPrototype.node = function() {
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
};

d3_selectionPrototype.size = function() {
  var n = 0;
  this.each(function() { ++n; });
  return n;
};

function d3_selection_enter(selection) {
  d3_subclass(selection, d3_selection_enterPrototype);
  return selection;
}

var d3_selection_enterPrototype = [];

d3.selection.enter = d3_selection_enter;
d3.selection.enter.prototype = d3_selection_enterPrototype;

d3_selection_enterPrototype.append = d3_selectionPrototype.append;
d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
d3_selection_enterPrototype.node = d3_selectionPrototype.node;
d3_selection_enterPrototype.call = d3_selectionPrototype.call;
d3_selection_enterPrototype.size = d3_selectionPrototype.size;


d3_selection_enterPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      upgroup,
      group,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    upgroup = (group = this[j]).update;
    subgroups.push(subgroup = []);
    subgroup.parentNode = group.parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
        subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

d3_selection_enterPrototype.insert = function(name, before) {
  if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
  return d3_selectionPrototype.insert.call(this, name, before);
};

function d3_selection_enterInsertBefore(enter) {
  var i0, j0;
  return function(d, i, j) {
    var group = enter[j].update,
        n = group.length,
        node;
    if (j != j0) j0 = j, i0 = 0;
    if (i >= i0) i0 = i + 1;
    while (!(node = group[i0]) && ++i0 < n);
    return node;
  };
}

// import "../transition/transition";

d3_selectionPrototype.transition = function() {
  var id = d3_transitionInheritId || ++d3_transitionId,
      subgroups = [],
      subgroup,
      node,
      transition = d3_transitionInherit || {time: Date.now(), ease: d3_ease_cubicInOut, delay: 0, duration: 250};

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) d3_transitionNode(node, i, id, transition);
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, id);
};
// import "../transition/transition";

d3_selectionPrototype.interrupt = function() {
  return this.each(d3_selection_interrupt);
};

function d3_selection_interrupt() {
  var lock = this.__transition__;
  if (lock) ++lock.active;
}

// TODO fast singleton implementation?
d3.select = function(node) {
  var group = [typeof node === "string" ? d3_select(node, d3_document) : node];
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

d3.selectAll = function(nodes) {
  var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

var d3_selectionRoot = d3.select(d3_documentElement);
  return d3;
})();
