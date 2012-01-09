// File: ./lib/zepto.js
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') };

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError();
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator;
      if(typeof fun != 'function') throw new TypeError();
      if(len == 0 && arguments.length == 1) throw new TypeError();

      if(arguments.length >= 2)
       accumulator = arguments[1];
      else
        do{
          if(k in t){
            accumulator = t[k++];
            break;
          }
          if(++k >= len) throw new TypeError();
        } while (true);

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t);
        k++;
      }
      return accumulator;
    };

})();
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $$, classList, emptyArray = [], slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+)[^>]*>/,
    elementTypes = [1, 9, 11],
    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]+)$/,
    tagSelectorRE = /^[\w-]+$/;

  function isF(value) { return ({}).toString.call(value) == "[object Function]" }
  function isO(value) { return value instanceof Object }
  function isA(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return array.filter(function(item){ return item !== undefined && item !== null }) }
  function flatten(array) { return array.length > 0 ? [].concat.apply([], array) : array }
  function camelize(str)  { return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str){
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase();
  }
  function uniq(array)    { return array.filter(function(item,index,array){ return array.indexOf(item) == index }) }

  function classRE(name){
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
  }

  function maybeAddPx(name, value) { return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value; }

  function defaultDisplay(nodeName) {
    var element, display;
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName);
      document.body.appendChild(element);
      display = getComputedStyle(element, '').getPropertyValue("display");
      element.parentNode.removeChild(element);
      display == "none" && (display = "block");
      elementDisplay[nodeName] = display;
    }
    return elementDisplay[nodeName];
  }

  function fragment(html, name) {
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;
    if (!(name in containers)) name = '*';
    var container = containers[name];
    container.innerHTML = '' + html;
    return slice.call(container.childNodes);
  }

  function Z(dom, selector){
    dom = dom || emptyArray;
    dom.__proto__ = Z.prototype;
    dom.selector = selector || '';
    return dom;
  }

  function $(selector, context){
    if (!selector) return Z();
    if (context !== undefined) return $(context).find(selector);
    else if (isF(selector)) return $(document).ready(selector);
    else if (selector instanceof Z) return selector;
    else {
      var dom;
      if (isA(selector)) dom = compact(selector);
      else if (elementTypes.indexOf(selector.nodeType) >= 0 || selector === window)
        dom = [selector], selector = null;
      else if (fragmentRE.test(selector))
        dom = fragment(selector.trim(), RegExp.$1), selector = null;
      else if (selector.nodeType && selector.nodeType == 3) dom = [selector];
      else dom = $$(document, selector);
      return Z(dom, selector);
    }
  }

  $.extend = function(target){
    slice.call(arguments, 1).forEach(function(source) {
      for (key in source) target[key] = source[key];
    })
    return target;
  }

  $.qsa = $$ = function(element, selector){
    var found;
    return (element === document && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : emptyArray ) :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      );
  }

  function filtered(nodes, selector){
    return selector === undefined ? $(nodes) : $(nodes).filter(selector);
  }

  function funcArg(context, arg, idx, payload){
   return isF(arg) ? arg.call(context, idx, payload) : arg;
  }

  $.isFunction = isF;
  $.isObject = isO;
  $.isArray = isA;

  $.inArray = function(elem, array, i) {
		return emptyArray.indexOf.call(array, elem, i);
	}

  $.map = function(elements, callback) {
    var value, values = [], i, key;
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i);
        if (value != null) values.push(value);
      }
    else
      for (key in elements) {
        value = callback(elements[key], key);
        if (value != null) values.push(value);
      }
    return flatten(values);
  }

  $.each = function(elements, callback) {
    var i, key;
    if (likeArray(elements))
      for(i = 0; i < elements.length; i++) {
        if(callback.call(elements[i], i, elements[i]) === false) return elements;
      }
    else
      for(key in elements) {
        if(callback.call(elements[key], key, elements[key]) === false) return elements;
      }
    return elements;
  }

  $.fn = {
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,
    map: function(fn){
      return $.map(this, function(el, i){ return fn.call(el, i, el) });
    },
    slice: function(){
      return $(slice.apply(this, arguments));
    },
    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($);
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false);
      return this;
    },
    get: function(idx){ return idx === undefined ? this : this[idx] },
    size: function(){ return this.length },
    remove: function () {
      return this.each(function () {
        if (this.parentNode != null) {
          this.parentNode.removeChild(this);
        }
      });
    },
    each: function(callback){
      this.forEach(function(el, idx){ callback.call(el, idx, el) });
      return this;
    },
    filter: function(selector){
      return $([].filter.call(this, function(element){
        return element.parentNode && $$(element.parentNode, selector).indexOf(element) >= 0;
      }));
    },
    end: function(){
      return this.prevObject || $();
    },
    andSelf:function(){
      return this.add(this.prevObject || $())
    },
    add:function(selector,context){
      return $(uniq(this.concat($(selector,context))));
    },
    is: function(selector){
      return this.length > 0 && $(this[0]).filter(selector).length > 0;
    },
    not: function(selector){
      var nodes=[];
      if (isF(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this);
        });
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isF(selector.item)) ? slice.call(selector) : $(selector);
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el);
        });
      }
      return $(nodes);
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1);
    },
    first: function(){ var el = this[0]; return el && !isO(el) ? el : $(el) },
    last: function(){ var el = this[this.length - 1]; return el && !isO(el) ? el : $(el) },
    find: function(selector){
      var result;
      if (this.length == 1) result = $$(this[0], selector);
      else result = this.map(function(){ return $$(this, selector) });
      return $(result);
    },
    closest: function(selector, context){
      var node = this[0], candidates = $$(context || document, selector);
      if (!candidates.length) node = null;
      while (node && candidates.indexOf(node) < 0)
        node = node !== context && node !== document && node.parentNode;
      return $(node);
    },
    parents: function(selector){
      var ancestors = [], nodes = this;
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && node !== document && ancestors.indexOf(node) < 0) {
            ancestors.push(node);
            return node;
          }
        });
      return filtered(ancestors, selector);
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector);
    },
    children: function(selector){
      return filtered(this.map(function(){ return slice.call(this.children) }), selector);
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return slice.call(el.parentNode.children).filter(function(child){ return child!==el });
      }), selector);
    },
    empty: function(){ return this.each(function(){ this.innerHTML = '' }) },
    pluck: function(property){ return this.map(function(){ return this[property] }) },
    show: function(){
      return this.each(function() {
        this.style.display == "none" && (this.style.display = null);
        if (getComputedStyle(this, '').getPropertyValue("display") == "none") {
          this.style.display = defaultDisplay(this.nodeName)
        }
      })
    },
    replaceWith: function(newContent) {
      return this.each(function() {
        $(this).before(newContent).remove();
      });
    },
    wrap: function(newContent) {
      return this.each(function() {
        $(this).wrapAll($(newContent)[0].cloneNode(false));
      });
    },
    wrapAll: function(newContent) {
      if (this[0]) {
        $(this[0]).before(newContent = $(newContent));
        newContent.append(this);
      }
      return this;
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children());
      });
      return this;
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return (setting === undefined ? this.css("display") == "none" : setting) ? this.show() : this.hide();
    },
    prev: function(){ return $(this.pluck('previousElementSibling')) },
    next: function(){ return $(this.pluck('nextElementSibling')) },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function (idx) {
          var originHtml = this.innerHTML;
          $(this).empty().append( funcArg(this, html, idx, originHtml) );
        });
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text });
    },
    attr: function(name, value){
      var res;
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(res = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : res
        ) :
        this.each(function(idx){
          if (isO(name)) for (key in name) this.setAttribute(key, name[key])
          else this.setAttribute(name, funcArg(this, value, idx, this.getAttribute(name)));
        });
    },
    removeAttr: function(name) {
      return this.each(function() { this.removeAttribute(name); });
    },
    data: function(name, value){
      return this.attr('data-' + name, value);
    },
    val: function(value){
      return (value === undefined) ?
        (this.length > 0 ? this[0].value : null) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value);
        });
    },
    offset: function(){
      if(this.length==0) return null;
      var obj = this[0].getBoundingClientRect();
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: obj.width,
        height: obj.height
      };
    },
    css: function(property, value){
      if (value === undefined && typeof property == 'string') {
        return(
          this.length == 0
            ? undefined
            : this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property)
        );
      }
      var css = '';
      for (key in property) css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
      if (typeof property == 'string') css = dasherize(property) + ":" + maybeAddPx(property, value);
      return this.each(function() { this.style.cssText += ';' + css });
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
    },
    hasClass: function(name){
      if (this.length < 1) return false;
      else return classRE(name).test(this[0].className);
    },
    addClass: function(name){
      return this.each(function(idx) {
        classList = [];
        var cls = this.className, newName = funcArg(this, name, idx, cls);
        newName.split(/\s+/g).forEach(function(klass) {
          if (!$(this).hasClass(klass)) {
            classList.push(klass)
          }
        }, this);
        classList.length && (this.className += (cls ? " " : "") + classList.join(" "))
      });
    },
    removeClass: function(name){
      return this.each(function(idx) {
        if(name === undefined)
          return this.className = '';
        classList = this.className;
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
          classList = classList.replace(classRE(klass), " ")
        });
        this.className = classList.trim()
      });
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var newName = funcArg(this, name, idx, this.className);
        (when === undefined ? !$(this).hasClass(newName) : when) ?
          $(this).addClass(newName) : $(this).removeClass(newName);
      });
    }
  };

  'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property){
    var fn = $.fn[property];
    $.fn[property] = function() {
      var ret = fn.apply(this, arguments);
      ret.prevObject = this;
      return ret;
    }
  });

  ['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value) {
      var offset, Dimension = dimension.replace(/./, function(m) { return m[0].toUpperCase() });
      if (value === undefined) return this[0] == window ? window['inner' + Dimension] :
        this[0] == document ? document.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension];
      else return this.each(function(idx){
        var el = $(this);
        el.css(dimension, funcArg(this, value, idx, el[dimension]()));
      });
    }
  });

  function insert(operator, target, node) {
    var parent = (operator % 2) ? target : target.parentNode;
    parent && parent.insertBefore(node,
      !operator ? target.nextSibling :      // after
      operator == 1 ? parent.firstChild :   // prepend
      operator == 2 ? target :              // before
      null);                                // append
  }

  function traverseNode (node, fun) {
    fun(node);
    for (var key in node.childNodes) {
      traverseNode(node.childNodes[key], fun);
    }
  }

  adjacencyOperators.forEach(function(key, operator) {
    $.fn[key] = function(html){
      var nodes = isO(html) ? html : fragment(html);
      if (!('length' in nodes) || nodes.nodeType) nodes = [nodes];
      if (nodes.length < 1) return this;
      var size = this.length, copyByClone = size > 1, inReverse = operator < 2;

      return this.each(function(index, target){
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[inReverse ? nodes.length-i-1 : i];
          traverseNode(node, function (node) {
            if (node.nodeName != null && node.nodeName.toUpperCase() === 'SCRIPT' && (!node.type || node.type === 'text/javascript')) {
              window['eval'].call(window, node.innerHTML);
            }
          });
          if (copyByClone && index < size - 1) node = node.cloneNode(true);
          insert(operator, target, node);
        }
      });
    };

    var reverseKey = (operator % 2) ? key+'To' : 'insert'+(operator ? 'Before' : 'After');
    $.fn[reverseKey] = function(html) {
      $(html)[key](this);
      return this;
    };
  });

  Z.prototype = $.fn;

  return $;
})();

window.Zepto = Zepto;
'$' in window || (window.$ = Zepto);
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function($){
  var $$ = $.qsa, handlers = {}, _zid = 1, specialEvents={};

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

  function zid(element) {
    return element._zid || (element._zid = _zid++);
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event);
    if (event.ns) var matcher = matcherFor(event.ns);
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || handler.fn == fn)
        && (!selector || handler.sel == selector);
    });
  }
  function parse(event) {
    var parts = ('' + event).split('.');
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')};
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
  }

  function eachEvent(events, fn, iterator){
    if ($.isObject(events)) $.each(events, iterator);
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) });
  }

  function add(element, events, fn, selector, getDelegate){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []));
    eachEvent(events, fn, function(event, fn){
      var delegate = getDelegate && getDelegate(fn, event),
        callback = delegate || fn;
      var proxyfn = function (event) {
        var result = callback.apply(element, [event].concat(event.data));
        if (result === false) event.preventDefault();
        return result;
      };
      var handler = $.extend(parse(event), {fn: fn, proxy: proxyfn, sel: selector, del: delegate, i: set.length});
      set.push(handler);
      element.addEventListener(handler.e, proxyfn, false);
    });
  }
  function remove(element, events, fn, selector){
    var id = zid(element);
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i];
        element.removeEventListener(handler.e, handler.proxy, false);
      });
    });
  }

  $.event = { add: add, remove: remove }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback);
    });
  };
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback);
    });
  };
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments);
          remove(element, type, fn);
          return result;
        }
      });
    });
  };

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      };
  function createProxy(event) {
    var proxy = $.extend({originalEvent: event}, event);
    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue;
        return event[name].apply(event, arguments);
      };
      proxy[predicate] = returnFalse;
    })
    return proxy;
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false;
      var prevent = event.preventDefault;
      event.preventDefault = function() {
        this.defaultPrevented = true;
        prevent.call(this);
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0);
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element});
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)));
          }
        }
      });
    });
  };
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector);
    });
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback);
    return this;
  };
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback);
    return this;
  };

  $.fn.on = function(event, selector, callback){
    return selector === undefined || $.isFunction(selector) ?
      this.bind(event, selector) : this.delegate(selector, event, callback);
  };
  $.fn.off = function(event, selector, callback){
    return selector === undefined || $.isFunction(selector) ?
      this.unbind(event, selector) : this.undelegate(selector, event, callback);
  };

  $.fn.trigger = function(event, data){
    if (typeof event == 'string') event = $.Event(event);
    fix(event);
    event.data = data;
    return this.each(function(){ this.dispatchEvent(event) });
  };

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result;
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event);
      e.data = data; e.target = element;
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e);
        if (e.isImmediatePropagationStopped()) return false;
      });
    });
    return result;
  };

  // shortcut methods for `.bind(event, fn)` for each event type
  ('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback){ return this.bind(event, callback) };
  });

  ['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback);
      else if (this.length) try { this.get(0)[name]() } catch(e){};
      return this;
    };
  });

  $.Event = function(type, props) {
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true;
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null);
    return event;
  };

})(Zepto);
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function($){
  function detect(ua){
    var os = (this.os = {}), browser = (this.browser = {}),
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/);

    if (webkit) browser.version = webkit[1];
    browser.webkit = !!webkit;

    if (android) os.android = true, os.version = android[2];
    if (iphone) os.ios = true, os.version = iphone[2].replace(/_/g, '.'), os.iphone = true;
    if (ipad) os.ios = true, os.version = ipad[2].replace(/_/g, '.'), os.ipad = true;
    if (webos) os.webos = true, os.version = webos[2];
    if (touchpad) os.touchpad = true;
    if (blackberry) os.blackberry = true, os.version = blackberry[2];
  }

  // ### $.os
  //
  // Object containing information about browser platform
  //
  // *Example:*
  //
  //     $.os.ios      // => true if running on Apple iOS
  //     $.os.android  // => true if running on Android
  //     $.os.webos    // => true if running on HP/Palm WebOS
  //     $.os.touchpad // => true if running on a HP TouchPad
  //     $.os.version  // => string with a version number, e.g.
  //                         "4.0", "3.1.1", "2.1", etc.
  //     $.os.iphone   // => true if running on iPhone
  //     $.os.ipad     // => true if running on iPad
  //     $.os.blackberry // => true if running on BlackBerry
  //
  // ### $.browser
  //
  // *Example:*
  //
  //     $.browser.webkit  // => true if the browser is WebKit-based
  //     $.browser.version // => WebKit version string
  detect.call($, navigator.userAgent);

  // make available to unit tests
  $.__detect = detect;

})(Zepto);
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = {Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS'},
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;

  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) };

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-';
      eventPrefix = event;
      return false;
    }
  });

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  };

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration;
    if (duration) duration = duration / 1000;
    return this.anim(properties, duration, ease, callback);
  };

  $.fn.anim = function(properties, duration, ease, callback){
    var transforms, cssProperties = {}, key, that = this, wrappedCallback, endEvent = $.fx.transitionEnd;
    if (duration === undefined) duration = 0.4;
    if ($.fx.off) duration = 0;

    if (typeof properties == 'string') {
      // keyframe animation
      cssProperties[prefix + 'animation-name'] = properties;
      cssProperties[prefix + 'animation-duration'] = duration + 's';
      endEvent = $.fx.animationEnd;
    } else {
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) {
          transforms || (transforms = []);
          transforms.push(key + '(' + properties[key] + ')');
        }
        else cssProperties[key] = properties[key];

      if (transforms) cssProperties[prefix + 'transform'] = transforms.join(' ');
      if (!$.fx.off) cssProperties[prefix + 'transition'] = 'all ' + duration + 's ' + (ease || '');
    }

    wrappedCallback = function(){
      var props = {};
      props[prefix + 'transition'] = props[prefix + 'animation-name'] = 'none';
      $(this).css(props);
      callback && callback.call(this);
    }
    if (duration > 0) this.one(endEvent, wrappedCallback);

    setTimeout(function() {
      that.css(cssProperties);
      if (duration <= 0) setTimeout(function() {
        that.each(function(){ wrappedCallback.call(this) });
      }, 0);
    }, 0);

    return this;
  };

  testEl = null;
})(Zepto);
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function($){
  var jsonpID = 0,
      isObject = $.isObject,
      document = window.document,
      key,
      name;

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName);
    $(context).trigger(event, data);
    return !event.defaultPrevented;
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data);
  }

  // Number of active Ajax requests
  $.active = 0;

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart');
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop');
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context;
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false;

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success';
    settings.success.call(context, data, status, xhr);
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
    ajaxComplete(status, xhr, settings);
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context;
    settings.error.call(context, xhr, type, error);
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error]);
    ajaxComplete(type, xhr, settings);
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context;
    settings.complete.call(context, xhr, status);
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
    ajaxStop(settings);
  }

  // Empty function, used as default callback
  function empty() {}

  // ### $.ajaxJSONP
  //
  // Load JSON from a server in a different domain (JSONP)
  //
  // *Arguments:*
  //
  //     options — object that configure the request,
  //               see avaliable options below
  //
  // *Avaliable options:*
  //
  //     url     — url to which the request is sent
  //     success — callback that is executed if the request succeeds
  //     error   — callback that is executed if the server drops error
  //     context — in which context to execute the callbacks in
  //
  // *Example:*
  //
  //     $.ajaxJSONP({
  //        url:     'http://example.com/projects?callback=?',
  //        success: function (data) {
  //            projects.push(json);
  //        }
  //     });
  //
  $.ajaxJSONP = function(options){
    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      abort = function(){
        $(script).remove();
        if (callbackName in window) window[callbackName] = empty;
        ajaxComplete('abort', xhr, options);
      },
      xhr = { abort: abort }, abortTimeout;

    window[callbackName] = function(data){
      clearTimeout(abortTimeout);
      $(script).remove();
      delete window[callbackName];
      ajaxSuccess(data, xhr, options);
    };

    if (isObject(options.data)) options.data = $.param(options.data);

    url = options.url.replace(/=\?/, '=' + callbackName)
    if (options.data) url += "&" + options.data;

    script.src = url

    $('head').append(script);

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.abort();
        ajaxComplete('timeout', xhr, options);
      }, options.timeout);

    return xhr;
  };

  // ### $.ajaxSettings
  //
  // AJAX settings
  //
  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest();
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   'application/json',
      xml:    'application/xml, text/xml',
      html:   'text/html',
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0
  };

  // ### $.ajax
  //
  // Perform AJAX request
  //
  // *Arguments:*
  //
  //     options — object that configure the request,
  //               see avaliable options below
  //
  // *Avaliable options:*
  //
  //     type ('GET')          — type of request GET / POST
  //     url (window.location) — url to which the request is sent
  //     data                  — data to send to server,
  //                             can be string or object
  //     dataType ('json')     — what response type you accept from
  //                             the server:
  //                             'json', 'xml', 'html', or 'text'
  //     timeout (0)           — request timeout
  //     beforeSend            — callback that is executed before
  //                             request send
  //     complete              — callback that is executed on request
  //                             complete (both: error and success)
  //     success               — callback that is executed if
  //                             the request succeeds
  //     error                 — callback that is executed if
  //                             the server drops error
  //     context               — in which context to execute the
  //                             callbacks in
  //
  // *Example:*
  //
  //     $.ajax({
  //        type:       'POST',
  //        url:        '/projects',
  //        data:       { name: 'Zepto.js' },
  //        dataType:   'html',
  //        timeout:    100,
  //        context:    $('body'),
  //        success:    function (data) {
  //            this.append(data);
  //        },
  //        error:    function (xhr, type) {
  //            alert('Error!');
  //        }
  //     });
  //
  $.ajax = function(options){
    var settings = $.extend({}, options || {});
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

    ajaxStart(settings);

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host;

    if (/=\?/.test(settings.url)) {
      return $.ajaxJSONP(settings);
    } else if (settings.dataType && settings.dataType.match(/jsonp/i)) {
      if (settings.url.match(/\?.*=/)) {
        settings.url += '&callback=?'
      } else {
        settings.url += '?callback=?'
      }

      return $.ajaxJSONP(settings);
    }

    if (!settings.url) settings.url = window.location.toString();
    if (settings.data && !settings.contentType) settings.contentType = 'application/x-www-form-urlencoded';
    if (isObject(settings.data)) settings.data = $.param(settings.data);

    if (settings.type.match(/get/i) && settings.data) {
      var queryString = settings.data;
      if (settings.url.match(/\?.*=/)) {
        queryString = '&' + queryString;
      } else if (queryString[0] != '?') {
        queryString = '?' + queryString;
      }
      settings.url += queryString;
    }

    var mime = settings.accepts[settings.dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = $.ajaxSettings.xhr(), abortTimeout;

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest';
    if (mime) baseHeaders['Accept'] = mime;
    settings.headers = $.extend(baseHeaders, settings.headers || {});

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        clearTimeout(abortTimeout);
        var result, error = false;
        if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status == 0 && protocol == 'file:')) {
          if (mime == 'application/json' && !(/^\s*$/.test(xhr.responseText))) {
            try { result = JSON.parse(xhr.responseText); }
            catch (e) { error = e; }
          }
          else result = xhr.responseText;
          if (error) ajaxError(error, 'parsererror', xhr, settings);
          else ajaxSuccess(result, xhr, settings);
        } else {
          ajaxError(null, 'error', xhr, settings);
        }
      }
    };

    var async = 'async' in settings ? settings.async : true;
    xhr.open(settings.type, settings.url, async);

    if (settings.contentType) settings.headers['Content-Type'] = settings.contentType;
    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name]);

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort();
      return false;
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty;
        xhr.abort();
        ajaxError(null, 'timeout', xhr, settings);
      }, settings.timeout);

    xhr.send(settings.data);
    return xhr;
  };

  // ### $.get
  //
  // Load data from the server using a GET request
  //
  // *Arguments:*
  //
  //     url     — url to which the request is sent
  //     success — callback that is executed if the request succeeds
  //
  // *Example:*
  //
  //     $.get(
  //        '/projects/42',
  //        function (data) {
  //            $('body').append(data);
  //        }
  //     );
  //
  $.get = function(url, success){ return $.ajax({ url: url, success: success }) };

  // ### $.post
  //
  // Load data from the server using POST request
  //
  // *Arguments:*
  //
  //     url        — url to which the request is sent
  //     [data]     — data to send to server, can be string or object
  //     [success]  — callback that is executed if the request succeeds
  //     [dataType] — type of expected response
  //                  'json', 'xml', 'html', or 'text'
  //
  // *Example:*
  //
  //     $.post(
  //        '/projects',
  //        { name: 'Zepto.js' },
  //        function (data) {
  //            $('body').append(data);
  //        },
  //        'html'
  //     );
  //
  $.post = function(url, data, success, dataType){
    if ($.isFunction(data)) dataType = dataType || success, success = data, data = null;
    return $.ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType });
  };

  // ### $.getJSON
  //
  // Load JSON from the server using GET request
  //
  // *Arguments:*
  //
  //     url     — url to which the request is sent
  //     success — callback that is executed if the request succeeds
  //
  // *Example:*
  //
  //     $.getJSON(
  //        '/projects/42',
  //        function (json) {
  //            projects.push(json);
  //        }
  //     );
  //
  $.getJSON = function(url, success){
    return $.ajax({ url: url, success: success, dataType: 'json' });
  };

  // ### $.fn.load
  //
  // Load data from the server into an element
  //
  // *Arguments:*
  //
  //     url     — url to which the request is sent
  //     [success] — callback that is executed if the request succeeds
  //
  // *Examples:*
  //
  //     $('#project_container').get(
  //        '/projects/42',
  //        function () {
  //            alert('Project was successfully loaded');
  //        }
  //     );
  //
  //     $('#project_comments').get(
  //        '/projects/42 #comments',
  //        function () {
  //            alert('Comments was successfully loaded');
  //        }
  //     );
  //
  $.fn.load = function(url, success){
    if (!this.length) return this;
    var self = this, parts = url.split(/\s/), selector;
    if (parts.length > 1) url = parts[0], selector = parts[1];
    $.get(url, function(response){
      self.html(selector ?
        $(document.createElement('div')).html(response).find(selector).html()
        : response);
      success && success.call(self);
    });
    return this;
  };

  var escape = encodeURIComponent;

  function serialize(params, obj, traditional, scope){
    var array = $.isArray(obj);
    $.each(obj, function(key, value) {
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']';
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value);
      // recurse into nested objects
      else if (traditional ? $.isArray(value) : isObject(value))
        serialize(params, value, traditional, key);
      else params.add(key, value);
    });
  }

  // ### $.param
  //
  // Encode object as a string of URL-encoded key-value pairs
  //
  // *Arguments:*
  //
  //     obj — object to serialize
  //     [traditional] — perform shallow serialization
  //
  // *Example:*
  //
  //     $.param( { name: 'Zepto.js', version: '0.6' } );
  //
  $.param = function(obj, traditional){
    var params = [];
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) };
    serialize(params, obj, traditional);
    return params.join('&').replace('%20', '+');
  };
})(Zepto);
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function ($) {

  // ### $.fn.serializeArray
  //
  // Encode a set of form elements as an array of names and values
  //
  // *Example:*
  //
  //     $('#login_form').serializeArray();
  //
  //  returns
  //
  //     [
  //         {
  //             name: 'email',
  //             value: 'koss@nocorp.me'
  //         },
  //         {
  //             name: 'password',
  //             value: '123456'
  //         }
  //     ]
  //
  $.fn.serializeArray = function () {
    var result = [], el;
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this);
      var type = el.attr('type');
      if (
        this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked)
      ) {
        result.push({
          name: el.attr('name'),
          value: el.val()
        });
      }
    });
    return result;
  };

  // ### $.fn.serialize
  //
  //
  // Encode a set of form elements as a string for submission
  //
  // *Example:*
  //
  //     $('#login_form').serialize();
  //
  //  returns
  //
  //     "email=koss%40nocorp.me&password=123456"
  //
  $.fn.serialize = function () {
    var result = [];
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) );
    });
    return result.join('&');
  };

  // ### $.fn.submit
  //
  // Bind or trigger the submit event for a form
  //
  // *Examples:*
  //
  // To bind a handler for the submit event:
  //
  //     $('#login_form').submit(function (e) {
  //         alert('Form was submitted!');
  //         e.preventDefault();
  //     });
  //
  // To trigger form submit:
  //
  //     $('#login_form').submit();
  //
  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit');
      this.eq(0).trigger(event);
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this;
  }

})(Zepto);
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

(function($){
  var touch = {}, touchTimeout;

  function parentIfText(node){
    return 'tagName' in node ? node : node.parentNode;
  }

  function swipeDirection(x1, x2, y1, y2){
    var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
    if (xDelta >= yDelta) {
      return (x1 - x2 > 0 ? 'Left' : 'Right');
    } else {
      return (y1 - y2 > 0 ? 'Up' : 'Down');
    }
  }

  var longTapDelay = 750;
  function longTap(){
    if (touch.last && (Date.now() - touch.last >= longTapDelay)) {
      touch.el.trigger('longTap');
      touch = {};
    }
  }

  $(document).ready(function(){
    $(document.body).bind('touchstart', function(e){
      var now = Date.now(), delta = now - (touch.last || now);
      touch.el = $(parentIfText(e.touches[0].target));
      touchTimeout && clearTimeout(touchTimeout);
      touch.x1 = e.touches[0].pageX;
      touch.y1 = e.touches[0].pageY;
      if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
      touch.last = now;
      setTimeout(longTap, longTapDelay);
    }).bind('touchmove', function(e){
      touch.x2 = e.touches[0].pageX;
      touch.y2 = e.touches[0].pageY;
    }).bind('touchend', function(e){
      if (touch.isDoubleTap) {
        touch.el.trigger('doubleTap');
        touch = {};
      } else if (touch.x2 > 0 || touch.y2 > 0) {
        (Math.abs(touch.x1 - touch.x2) > 30 || Math.abs(touch.y1 - touch.y2) > 30)  &&
          touch.el.trigger('swipe') &&
          touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
        touch.x1 = touch.x2 = touch.y1 = touch.y2 = touch.last = 0;
      } else if ('last' in touch) {
        touch.el.trigger('tap');

        touchTimeout = setTimeout(function(){
          touchTimeout = null;
          touch.el.trigger('singleTap');
          touch = {};
        }, 250);
      }
    }).bind('touchcancel', function(){ touch = {} });
  });

  ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback) }
  });
})(Zepto);

// File: ./lib/store.js
/* Copyright (c) 2010-2011 Marcus Westin
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var store = (function(){
	var api = {},
		win = window,
		doc = win.document,
		localStorageName = 'localStorage',
		globalStorageName = 'globalStorage',
		namespace = '__storejs__',
		storage

	api.disabled = false
	api.set = function(key, value) {}
	api.get = function(key) {}
	api.remove = function(key) {}
	api.clear = function() {}
	api.transact = function(key, transactionFn) {
		var val = api.get(key)
		if (typeof val == 'undefined') { val = {} }
		transactionFn(val)
		api.set(key, val)
	}

	api.serialize = function(value) {
		return JSON.stringify(value)
	}
	api.deserialize = function(value) {
		if (typeof value === "undefined" || typeof value != 'string' || value === "undefined" || value === "null") { return undefined }        
		return JSON.parse(value)
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior 
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}
	
	function isGlobalStorageNameSupported() {
		try { return (globalStorageName in win && win[globalStorageName] && win[globalStorageName][win.location.hostname]) }
		catch(err) { return false }
	}	

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		api.set = function(key, val) { 
			if (typeof val === "undefined" || val === null)
				api.remove(key)
			else
				storage.setItem(key, api.serialize(val)) 			
		}
		api.get = function(key) { return api.deserialize(storage.getItem(key)) }
		api.remove = function(key) { storage.removeItem(key) }
		api.clear = function() { storage.clear() }

	} else if (isGlobalStorageNameSupported()) {
		storage = win[globalStorageName][win.location.hostname]
		api.set = function(key, val) { storage[key] = api.serialize(val) }
		api.get = function(key) { return api.deserialize(storage[key] && storage[key].value) }
		api.remove = function(key) { delete storage[key] }
		api.clear = function() { for (var key in storage ) { delete storage[key] } }

	} else if (doc.documentElement.addBehavior) {
		var storage = doc.createElement('div')
		function withIEStorage(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				doc.body.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(api, args)
				doc.body.removeChild(storage)
				return result
			}
		}
		api.set = withIEStorage(function(storage, key, val) {
			storage.setAttribute(key, api.serialize(val))
			storage.save(localStorageName)
		})
		api.get = withIEStorage(function(storage, key) {
			return api.deserialize(storage.getAttribute(key))
		})
		api.remove = withIEStorage(function(storage, key) {
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		api.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr = attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
	}
	
	try {
		api.set(namespace, namespace)
		if (api.get(namespace) != namespace) { api.disabled = true }
		api.remove(namespace)
	} catch(e) {
		api.disabled = true
	}
	
	return api
})();

if (typeof module != 'undefined') { module.exports = store }

// File: ./lib/underscore-min.js
// Underscore.js 1.2.0
// (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){function q(a,c,d){if(a===c)return a!==0||1/a==1/c;if(a==null)return a===c;var e=typeof a;if(e!=typeof c)return false;if(!a!=!c)return false;if(b.isNaN(a))return b.isNaN(c);var f=b.isString(a),g=b.isString(c);if(f||g)return f&&g&&String(a)==String(c);f=b.isNumber(a);g=b.isNumber(c);if(f||g)return f&&g&&+a==+c;f=b.isBoolean(a);g=b.isBoolean(c);if(f||g)return f&&g&&+a==+c;f=b.isDate(a);g=b.isDate(c);if(f||g)return f&&g&&a.getTime()==c.getTime();f=b.isRegExp(a);g=b.isRegExp(c);if(f||g)return f&&
g&&a.source==c.source&&a.global==c.global&&a.multiline==c.multiline&&a.ignoreCase==c.ignoreCase;if(e!="object")return false;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(b.isFunction(a.isEqual))return a.isEqual(c);for(e=d.length;e--;)if(d[e]==a)return true;d.push(a);e=0;f=true;if(a.length===+a.length||c.length===+c.length){if(e=a.length,f=e==c.length)for(;e--;)if(!(f=e in a==e in c&&q(a[e],c[e],d)))break}else{for(var h in a)if(l.call(a,h)&&(e++,!(f=l.call(c,h)&&q(a[h],c[h],d))))break;if(f){for(h in c)if(l.call(c,
h)&&!e--)break;f=!e}}d.pop();return f}var r=this,F=r._,n={},k=Array.prototype,o=Object.prototype,i=k.slice,G=k.unshift,u=o.toString,l=o.hasOwnProperty,v=k.forEach,w=k.map,x=k.reduce,y=k.reduceRight,z=k.filter,A=k.every,B=k.some,p=k.indexOf,C=k.lastIndexOf,o=Array.isArray,H=Object.keys,s=Function.prototype.bind,b=function(a){return new m(a)};typeof module!=="undefined"&&module.exports?(module.exports=b,b._=b):r._=b;b.VERSION="1.2.0";var j=b.each=b.forEach=function(a,c,b){if(a!=null)if(v&&a.forEach===
v)a.forEach(c,b);else if(a.length===+a.length)for(var e=0,f=a.length;e<f;e++){if(e in a&&c.call(b,a[e],e,a)===n)break}else for(e in a)if(l.call(a,e)&&c.call(b,a[e],e,a)===n)break};b.map=function(a,c,b){var e=[];if(a==null)return e;if(w&&a.map===w)return a.map(c,b);j(a,function(a,g,h){e[e.length]=c.call(b,a,g,h)});return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var f=d!==void 0;a==null&&(a=[]);if(x&&a.reduce===x)return e&&(c=b.bind(c,e)),f?a.reduce(c,d):a.reduce(c);j(a,function(a,b,i){f?d=c.call(e,
d,a,b,i):(d=a,f=true)});if(!f)throw new TypeError("Reduce of empty array with no initial value");return d};b.reduceRight=b.foldr=function(a,c,d,e){a==null&&(a=[]);if(y&&a.reduceRight===y)return e&&(c=b.bind(c,e)),d!==void 0?a.reduceRight(c,d):a.reduceRight(c);a=(b.isArray(a)?a.slice():b.toArray(a)).reverse();return b.reduce(a,c,d,e)};b.find=b.detect=function(a,c,b){var e;D(a,function(a,g,h){if(c.call(b,a,g,h))return e=a,true});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;
if(z&&a.filter===z)return a.filter(c,b);j(a,function(a,g,h){c.call(b,a,g,h)&&(e[e.length]=a)});return e};b.reject=function(a,c,b){var e=[];if(a==null)return e;j(a,function(a,g,h){c.call(b,a,g,h)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=true;if(a==null)return e;if(A&&a.every===A)return a.every(c,b);j(a,function(a,g,h){if(!(e=e&&c.call(b,a,g,h)))return n});return e};var D=b.some=b.any=function(a,c,d){var c=c||b.identity,e=false;if(a==null)return e;if(B&&a.some===B)return a.some(c,
d);j(a,function(a,b,h){if(e|=c.call(d,a,b,h))return n});return!!e};b.include=b.contains=function(a,c){var b=false;if(a==null)return b;if(p&&a.indexOf===p)return a.indexOf(c)!=-1;D(a,function(a){if(b=a===c)return true});return b};b.invoke=function(a,c){var d=i.call(arguments,2);return b.map(a,function(a){return(c.call?c||a:a[c]).apply(a,d)})};b.pluck=function(a,c){return b.map(a,function(a){return a[c]})};b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);if(!c&&b.isEmpty(a))return-Infinity;
var e={computed:-Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);if(!c&&b.isEmpty(a))return Infinity;var e={computed:Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b<e.computed&&(e={value:a,computed:b})});return e.value};b.shuffle=function(a){var c=[],b;j(a,function(a,f){f==0?c[0]=a:(b=Math.floor(Math.random()*(f+1)),c[f]=c[b],c[b]=a)});return c};b.sortBy=function(a,
c,d){return b.pluck(b.map(a,function(a,b,g){return{value:a,criteria:c.call(d,a,b,g)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.groupBy=function(a,b){var d={};j(a,function(a,f){var g=b(a,f);(d[g]||(d[g]=[])).push(a)});return d};b.sortedIndex=function(a,c,d){d||(d=b.identity);for(var e=0,f=a.length;e<f;){var g=e+f>>1;d(a[g])<d(c)?e=g+1:f=g}return e};b.toArray=function(a){return!a?[]:a.toArray?a.toArray():b.isArray(a)?i.call(a):b.isArguments(a)?i.call(a):
b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?i.call(a,0,b):a[0]};b.initial=function(a,b,d){return i.call(a,0,a.length-(b==null||d?1:b))};b.last=function(a,b,d){return b!=null&&!d?i.call(a,a.length-b):a[a.length-1]};b.rest=b.tail=function(a,b,d){return i.call(a,b==null||d?1:b)};b.compact=function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a){return b.reduce(a,function(a,d){if(b.isArray(d))return a.concat(b.flatten(d));
a[a.length]=d;return a},[])};b.without=function(a){return b.difference(a,i.call(arguments,1))};b.uniq=b.unique=function(a,c,d){var d=d?b.map(a,d):a,e=[];b.reduce(d,function(d,g,h){if(0==h||(c===true?b.last(d)!=g:!b.include(d,g)))d[d.length]=g,e[e.length]=a[h];return d},[]);return e};b.union=function(){return b.uniq(b.flatten(arguments))};b.intersection=b.intersect=function(a){var c=i.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};
b.difference=function(a,c){return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=i.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(p&&a.indexOf===p)return a.indexOf(c);for(d=0,e=a.length;d<e;d++)if(a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(C&&a.lastIndexOf===C)return a.lastIndexOf(b);
for(var d=a.length;d--;)if(a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);for(var d=arguments[2]||1,e=Math.max(Math.ceil((b-a)/d),0),f=0,g=Array(e);f<e;)g[f++]=a,a+=d;return g};b.bind=function(a,b){if(a.bind===s&&s)return s.apply(a,i.call(arguments,1));var d=i.call(arguments,2);return function(){return a.apply(b,d.concat(i.call(arguments)))}};b.bindAll=function(a){var c=i.call(arguments,1);c.length==0&&(c=b.functions(a));j(c,function(c){a[c]=b.bind(a[c],a)});
return a};b.memoize=function(a,c){var d={};c||(c=b.identity);return function(){var b=c.apply(this,arguments);return l.call(d,b)?d[b]:d[b]=a.apply(this,arguments)}};b.delay=function(a,b){var d=i.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(i.call(arguments,1)))};var E=function(a,b,d){var e;return function(){var f=this,g=arguments,h=function(){e=null;a.apply(f,g)};d&&clearTimeout(e);if(d||!e)e=setTimeout(h,b)}};b.throttle=
function(a,b){return E(a,b,false)};b.debounce=function(a,b){return E(a,b,true)};b.once=function(a){var b=false,d;return function(){if(b)return d;b=true;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=[a].concat(i.call(arguments));return b.apply(this,d)}};b.compose=function(){var a=i.call(arguments);return function(){for(var b=i.call(arguments),d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=function(a,b){return function(){if(--a<1)return b.apply(this,
arguments)}};b.keys=H||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var b=[],d;for(d in a)l.call(a,d)&&(b[b.length]=d);return b};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){j(i.call(arguments,1),function(b){for(var d in b)b[d]!==void 0&&(a[d]=b[d])});return a};b.defaults=function(a){j(i.call(arguments,1),function(b){for(var d in b)a[d]==null&&(a[d]=
b[d])});return a};b.clone=function(a){return b.isArray(a)?a.slice():b.extend({},a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,b){return q(a,b,[])};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(l.call(a,c))return false;return true};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=o||function(a){return u.call(a)==="[object Array]"};b.isObject=function(a){return a===Object(a)};b.isArguments=function(a){return!(!a||!l.call(a,"callee"))};
b.isFunction=function(a){return!(!a||!a.constructor||!a.call||!a.apply)};b.isString=function(a){return!!(a===""||a&&a.charCodeAt&&a.substr)};b.isNumber=function(a){return!!(a===0||a&&a.toExponential&&a.toFixed)};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===true||a===false||u.call(a)=="[object Boolean]"};b.isDate=function(a){return!(!a||!a.getTimezoneOffset||!a.setUTCFullYear)};b.isRegExp=function(a){return!(!a||!a.test||!a.exec||!(a.ignoreCase||a.ignoreCase===false))};b.isNull=
function(a){return a===null};b.isUndefined=function(a){return a===void 0};b.noConflict=function(){r._=F;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.escape=function(a){return(""+a).replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")};b.mixin=function(a){j(b.functions(a),function(c){I(c,b[c]=a[c])})};var J=0;b.uniqueId=function(a){var b=
J++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};b.template=function(a,c){var d=b.templateSettings,d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.escape,function(a,b){return"',_.escape("+b.replace(/\\'/g,"'")+"),'"}).replace(d.interpolate,function(a,b){return"',"+b.replace(/\\'/g,"'")+",'"}).replace(d.evaluate||null,function(a,
b){return"');"+b.replace(/\\'/g,"'").replace(/[\r\n\t]/g," ")+"__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",d=new Function("obj",d);return c?d(c):d};var m=function(a){this._wrapped=a};b.prototype=m.prototype;var t=function(a,c){return c?b(a).chain():a},I=function(a,c){m.prototype[a]=function(){var a=i.call(arguments);G.call(a,this._wrapped);return t(c.apply(b,a),this._chain)}};b.mixin(b);j("pop,push,reverse,shift,sort,splice,unshift".split(","),
function(a){var b=k[a];m.prototype[a]=function(){b.apply(this._wrapped,arguments);return t(this._wrapped,this._chain)}});j(["concat","join","slice"],function(a){var b=k[a];m.prototype[a]=function(){return t(b.apply(this._wrapped,arguments),this._chain)}});m.prototype.chain=function(){this._chain=true;return this};m.prototype.value=function(){return this._wrapped}})();

// File: ./lib/backbone-min.js
// Backbone.js 0.5.3
// (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
// Backbone may be freely distributed under the MIT license.
// For all details and documentation:
// http://documentcloud.github.com/backbone
(function(){var h=this,p=h.Backbone,e;e=typeof exports!=="undefined"?exports:h.Backbone={};e.VERSION="0.5.3";var f=h._;if(!f&&typeof require!=="undefined")f=require("underscore")._;var g=h.jQuery||h.Zepto;e.noConflict=function(){h.Backbone=p;return this};e.emulateHTTP=!1;e.emulateJSON=!1;e.Events={bind:function(a,b,c){var d=this._callbacks||(this._callbacks={});(d[a]||(d[a]=[])).push([b,c]);return this},unbind:function(a,b){var c;if(a){if(c=this._callbacks)if(b){c=c[a];if(!c)return this;for(var d=
0,e=c.length;d<e;d++)if(c[d]&&b===c[d][0]){c[d]=null;break}}else c[a]=[]}else this._callbacks={};return this},trigger:function(a){var b,c,d,e,f=2;if(!(c=this._callbacks))return this;for(;f--;)if(b=f?a:"all",b=c[b])for(var g=0,h=b.length;g<h;g++)(d=b[g])?(e=f?Array.prototype.slice.call(arguments,1):arguments,d[0].apply(d[1]||this,e)):(b.splice(g,1),g--,h--);return this}};e.Model=function(a,b){var c;a||(a={});if(c=this.defaults)f.isFunction(c)&&(c=c.call(this)),a=f.extend({},c,a);this.attributes={};
this._escapedAttributes={};this.cid=f.uniqueId("c");this.set(a,{silent:!0});this._changed=!1;this._previousAttributes=f.clone(this.attributes);if(b&&b.collection)this.collection=b.collection;this.initialize(a,b)};f.extend(e.Model.prototype,e.Events,{_previousAttributes:null,_changed:!1,idAttribute:"id",initialize:function(){},toJSON:function(){return f.clone(this.attributes)},get:function(a){return this.attributes[a]},escape:function(a){var b;if(b=this._escapedAttributes[a])return b;b=this.attributes[a];
return this._escapedAttributes[a]=(b==null?"":""+b).replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")},has:function(a){return this.attributes[a]!=null},set:function(a,b){b||(b={});if(!a)return this;if(a.attributes)a=a.attributes;var c=this.attributes,d=this._escapedAttributes;if(!b.silent&&this.validate&&!this._performValidation(a,b))return!1;if(this.idAttribute in a)this.id=a[this.idAttribute];
var e=this._changing;this._changing=!0;for(var g in a){var h=a[g];if(!f.isEqual(c[g],h))c[g]=h,delete d[g],this._changed=!0,b.silent||this.trigger("change:"+g,this,h,b)}!e&&!b.silent&&this._changed&&this.change(b);this._changing=!1;return this},unset:function(a,b){if(!(a in this.attributes))return this;b||(b={});var c={};c[a]=void 0;if(!b.silent&&this.validate&&!this._performValidation(c,b))return!1;delete this.attributes[a];delete this._escapedAttributes[a];a==this.idAttribute&&delete this.id;this._changed=
!0;b.silent||(this.trigger("change:"+a,this,void 0,b),this.change(b));return this},clear:function(a){a||(a={});var b,c=this.attributes,d={};for(b in c)d[b]=void 0;if(!a.silent&&this.validate&&!this._performValidation(d,a))return!1;this.attributes={};this._escapedAttributes={};this._changed=!0;if(!a.silent){for(b in c)this.trigger("change:"+b,this,void 0,a);this.change(a)}return this},fetch:function(a){a||(a={});var b=this,c=a.success;a.success=function(d,e,f){if(!b.set(b.parse(d,f),a))return!1;c&&
c(b,d)};a.error=i(a.error,b,a);return(this.sync||e.sync).call(this,"read",this,a)},save:function(a,b){b||(b={});if(a&&!this.set(a,b))return!1;var c=this,d=b.success;b.success=function(a,e,f){if(!c.set(c.parse(a,f),b))return!1;d&&d(c,a,f)};b.error=i(b.error,c,b);var f=this.isNew()?"create":"update";return(this.sync||e.sync).call(this,f,this,b)},destroy:function(a){a||(a={});if(this.isNew())return this.trigger("destroy",this,this.collection,a);var b=this,c=a.success;a.success=function(d){b.trigger("destroy",
b,b.collection,a);c&&c(b,d)};a.error=i(a.error,b,a);return(this.sync||e.sync).call(this,"delete",this,a)},url:function(){var a=k(this.collection)||this.urlRoot||l();if(this.isNew())return a;return a+(a.charAt(a.length-1)=="/"?"":"/")+encodeURIComponent(this.id)},parse:function(a){return a},clone:function(){return new this.constructor(this)},isNew:function(){return this.id==null},change:function(a){this.trigger("change",this,a);this._previousAttributes=f.clone(this.attributes);this._changed=!1},hasChanged:function(a){if(a)return this._previousAttributes[a]!=
this.attributes[a];return this._changed},changedAttributes:function(a){a||(a=this.attributes);var b=this._previousAttributes,c=!1,d;for(d in a)f.isEqual(b[d],a[d])||(c=c||{},c[d]=a[d]);return c},previous:function(a){if(!a||!this._previousAttributes)return null;return this._previousAttributes[a]},previousAttributes:function(){return f.clone(this._previousAttributes)},_performValidation:function(a,b){var c=this.validate(a);if(c)return b.error?b.error(this,c,b):this.trigger("error",this,c,b),!1;return!0}});
e.Collection=function(a,b){b||(b={});if(b.comparator)this.comparator=b.comparator;f.bindAll(this,"_onModelEvent","_removeReference");this._reset();a&&this.reset(a,{silent:!0});this.initialize.apply(this,arguments)};f.extend(e.Collection.prototype,e.Events,{model:e.Model,initialize:function(){},toJSON:function(){return this.map(function(a){return a.toJSON()})},add:function(a,b){if(f.isArray(a))for(var c=0,d=a.length;c<d;c++)this._add(a[c],b);else this._add(a,b);return this},remove:function(a,b){if(f.isArray(a))for(var c=
0,d=a.length;c<d;c++)this._remove(a[c],b);else this._remove(a,b);return this},get:function(a){if(a==null)return null;return this._byId[a.id!=null?a.id:a]},getByCid:function(a){return a&&this._byCid[a.cid||a]},at:function(a){return this.models[a]},sort:function(a){a||(a={});if(!this.comparator)throw Error("Cannot sort a set without a comparator");this.models=this.sortBy(this.comparator);a.silent||this.trigger("reset",this,a);return this},pluck:function(a){return f.map(this.models,function(b){return b.get(a)})},
reset:function(a,b){a||(a=[]);b||(b={});this.each(this._removeReference);this._reset();this.add(a,{silent:!0});b.silent||this.trigger("reset",this,b);return this},fetch:function(a){a||(a={});var b=this,c=a.success;a.success=function(d,f,e){b[a.add?"add":"reset"](b.parse(d,e),a);c&&c(b,d)};a.error=i(a.error,b,a);return(this.sync||e.sync).call(this,"read",this,a)},create:function(a,b){var c=this;b||(b={});a=this._prepareModel(a,b);if(!a)return!1;var d=b.success;b.success=function(a,e,f){c.add(a,b);
d&&d(a,e,f)};a.save(null,b);return a},parse:function(a){return a},chain:function(){return f(this.models).chain()},_reset:function(){this.length=0;this.models=[];this._byId={};this._byCid={}},_prepareModel:function(a,b){if(a instanceof e.Model){if(!a.collection)a.collection=this}else{var c=a;a=new this.model(c,{collection:this});a.validate&&!a._performValidation(c,b)&&(a=!1)}return a},_add:function(a,b){b||(b={});a=this._prepareModel(a,b);if(!a)return!1;var c=this.getByCid(a);if(c)throw Error(["Can't add the same model to a set twice",
c.id]);this._byId[a.id]=a;this._byCid[a.cid]=a;this.models.splice(b.at!=null?b.at:this.comparator?this.sortedIndex(a,this.comparator):this.length,0,a);a.bind("all",this._onModelEvent);this.length++;b.silent||a.trigger("add",a,this,b);return a},_remove:function(a,b){b||(b={});a=this.getByCid(a)||this.get(a);if(!a)return null;delete this._byId[a.id];delete this._byCid[a.cid];this.models.splice(this.indexOf(a),1);this.length--;b.silent||a.trigger("remove",a,this,b);this._removeReference(a);return a},
_removeReference:function(a){this==a.collection&&delete a.collection;a.unbind("all",this._onModelEvent)},_onModelEvent:function(a,b,c,d){(a=="add"||a=="remove")&&c!=this||(a=="destroy"&&this._remove(b,d),b&&a==="change:"+b.idAttribute&&(delete this._byId[b.previous(b.idAttribute)],this._byId[b.id]=b),this.trigger.apply(this,arguments))}});f.each(["forEach","each","map","reduce","reduceRight","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","max",
"min","sortBy","sortedIndex","toArray","size","first","rest","last","without","indexOf","lastIndexOf","isEmpty","groupBy"],function(a){e.Collection.prototype[a]=function(){return f[a].apply(f,[this.models].concat(f.toArray(arguments)))}});e.Router=function(a){a||(a={});if(a.routes)this.routes=a.routes;this._bindRoutes();this.initialize.apply(this,arguments)};var q=/:([\w\d]+)/g,r=/\*([\w\d]+)/g,s=/[-[\]{}()+?.,\\^$|#\s]/g;f.extend(e.Router.prototype,e.Events,{initialize:function(){},route:function(a,
b,c){e.history||(e.history=new e.History);f.isRegExp(a)||(a=this._routeToRegExp(a));e.history.route(a,f.bind(function(d){d=this._extractParameters(a,d);c.apply(this,d);this.trigger.apply(this,["route:"+b].concat(d))},this))},navigate:function(a,b){e.history.navigate(a,b)},_bindRoutes:function(){if(this.routes){var a=[],b;for(b in this.routes)a.unshift([b,this.routes[b]]);b=0;for(var c=a.length;b<c;b++)this.route(a[b][0],a[b][1],this[a[b][1]])}},_routeToRegExp:function(a){a=a.replace(s,"\\$&").replace(q,
"([^/]*)").replace(r,"(.*?)");return RegExp("^"+a+"$")},_extractParameters:function(a,b){return a.exec(b).slice(1)}});e.History=function(){this.handlers=[];f.bindAll(this,"checkUrl")};var j=/^#*/,t=/msie [\w.]+/,m=!1;f.extend(e.History.prototype,{interval:50,getFragment:function(a,b){if(a==null)if(this._hasPushState||b){a=window.location.pathname;var c=window.location.search;c&&(a+=c);a.indexOf(this.options.root)==0&&(a=a.substr(this.options.root.length))}else a=window.location.hash;return decodeURIComponent(a.replace(j,
""))},start:function(a){if(m)throw Error("Backbone.history has already been started");this.options=f.extend({},{root:"/"},this.options,a);this._wantsPushState=!!this.options.pushState;this._hasPushState=!(!this.options.pushState||!window.history||!window.history.pushState);a=this.getFragment();var b=document.documentMode;if(b=t.exec(navigator.userAgent.toLowerCase())&&(!b||b<=7))this.iframe=g('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(a);
this._hasPushState?g(window).bind("popstate",this.checkUrl):"onhashchange"in window&&!b?g(window).bind("hashchange",this.checkUrl):setInterval(this.checkUrl,this.interval);this.fragment=a;m=!0;a=window.location;b=a.pathname==this.options.root;if(this._wantsPushState&&!this._hasPushState&&!b)return this.fragment=this.getFragment(null,!0),window.location.replace(this.options.root+"#"+this.fragment),!0;else if(this._wantsPushState&&this._hasPushState&&b&&a.hash)this.fragment=a.hash.replace(j,""),window.history.replaceState({},
document.title,a.protocol+"//"+a.host+this.options.root+this.fragment);if(!this.options.silent)return this.loadUrl()},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(){var a=this.getFragment();a==this.fragment&&this.iframe&&(a=this.getFragment(this.iframe.location.hash));if(a==this.fragment||a==decodeURIComponent(this.fragment))return!1;this.iframe&&this.navigate(a);this.loadUrl()||this.loadUrl(window.location.hash)},loadUrl:function(a){var b=this.fragment=this.getFragment(a);
return f.any(this.handlers,function(a){if(a.route.test(b))return a.callback(b),!0})},navigate:function(a,b){var c=(a||"").replace(j,"");if(!(this.fragment==c||this.fragment==decodeURIComponent(c))){if(this._hasPushState){var d=window.location;c.indexOf(this.options.root)!=0&&(c=this.options.root+c);this.fragment=c;window.history.pushState({},document.title,d.protocol+"//"+d.host+c)}else if(window.location.hash=this.fragment=c,this.iframe&&c!=this.getFragment(this.iframe.location.hash))this.iframe.document.open().close(),
this.iframe.location.hash=c;b&&this.loadUrl(a)}}});e.View=function(a){this.cid=f.uniqueId("view");this._configure(a||{});this._ensureElement();this.delegateEvents();this.initialize.apply(this,arguments)};var u=/^(\S+)\s*(.*)$/,n=["model","collection","el","id","attributes","className","tagName"];f.extend(e.View.prototype,e.Events,{tagName:"div",$:function(a){return g(a,this.el)},initialize:function(){},render:function(){return this},remove:function(){g(this.el).remove();return this},make:function(a,
b,c){a=document.createElement(a);b&&g(a).attr(b);c&&g(a).html(c);return a},delegateEvents:function(a){if(a||(a=this.events))for(var b in f.isFunction(a)&&(a=a.call(this)),g(this.el).unbind(".delegateEvents"+this.cid),a){var c=this[a[b]];if(!c)throw Error('Event "'+a[b]+'" does not exist');var d=b.match(u),e=d[1];d=d[2];c=f.bind(c,this);e+=".delegateEvents"+this.cid;d===""?g(this.el).bind(e,c):g(this.el).delegate(d,e,c)}},_configure:function(a){this.options&&(a=f.extend({},this.options,a));for(var b=
0,c=n.length;b<c;b++){var d=n[b];a[d]&&(this[d]=a[d])}this.options=a},_ensureElement:function(){if(this.el){if(f.isString(this.el))this.el=g(this.el).get(0)}else{var a=this.attributes||{};if(this.id)a.id=this.id;if(this.className)a["class"]=this.className;this.el=this.make(this.tagName,a)}}});e.Model.extend=e.Collection.extend=e.Router.extend=e.View.extend=function(a,b){var c=v(this,a,b);c.extend=this.extend;return c};var w={create:"POST",update:"PUT","delete":"DELETE",read:"GET"};e.sync=function(a,
b,c){var d=w[a];c=f.extend({type:d,dataType:"json"},c);if(!c.url)c.url=k(b)||l();if(!c.data&&b&&(a=="create"||a=="update"))c.contentType="application/json",c.data=JSON.stringify(b.toJSON());if(e.emulateJSON)c.contentType="application/x-www-form-urlencoded",c.data=c.data?{model:c.data}:{};if(e.emulateHTTP&&(d==="PUT"||d==="DELETE")){if(e.emulateJSON)c.data._method=d;c.type="POST";c.beforeSend=function(a){a.setRequestHeader("X-HTTP-Method-Override",d)}}if(c.type!=="GET"&&!e.emulateJSON)c.processData=
!1;return g.ajax(c)};var o=function(){},v=function(a,b,c){var d;d=b&&b.hasOwnProperty("constructor")?b.constructor:function(){return a.apply(this,arguments)};f.extend(d,a);o.prototype=a.prototype;d.prototype=new o;b&&f.extend(d.prototype,b);c&&f.extend(d,c);d.prototype.constructor=d;d.__super__=a.prototype;return d},k=function(a){if(!a||!a.url)return null;return f.isFunction(a.url)?a.url():a.url},l=function(){throw Error('A "url" property or function must be specified');},i=function(a,b,c){return function(d){a?
a(b,d,c):b.trigger("error",b,d,c)}}}).call(this);

// File: ./lib/jquery.nanoscroller.min.js
(function($, window, document) {
  var DOMSCROLL, DOWN, DRAG, MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEWHEEL, NanoScroll, PANEDOWN, RESIZE, SCROLL, SCROLLBAR, UP, WHEEL, getScrollbarWidth;
  SCROLLBAR = 'scrollbar';
  SCROLL = 'scroll';
  MOUSEDOWN = 'mousedown';
  MOUSEMOVE = 'mousemove';
  MOUSEWHEEL = 'mousewheel';
  MOUSEUP = 'mouseup';
  RESIZE = 'resize';
  DRAG = 'drag';
  UP = 'up';
  PANEDOWN = 'panedown';
  DOMSCROLL = 'DOMMouseScroll';
  DOWN = 'down';
  WHEEL = 'wheel';
  getScrollbarWidth = function() {
    var noscrollWidth, outer, yesscrollWidth;
    outer = document.createElement('div');
    outer.style.position = 'absolute';
    outer.style.width = '100px';
    outer.style.height = '100px';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    noscrollWidth = outer.offsetWidth;
    yesscrollWidth = outer.scrollWidth;
    document.body.removeChild(outer);
    return noscrollWidth - yesscrollWidth;
  };
  NanoScroll = (function() {

    function NanoScroll(el) {
      this.el = el;
      this.generate();
      this.createEvents();
      this.addEvents();
      this.reset();
    }

    NanoScroll.prototype.createEvents = function() {
      var _this = this;
      this.events = {
        down: function(e) {
          _this.isDrag = true;
          _this.offsetY = e.clientY - _this.slider.offset().top;
          _this.pane.addClass('active');
          $(document).bind(MOUSEMOVE, _this.events[DRAG]);
          $(document).bind(MOUSEUP, _this.events[UP]);
          return false;
        },
        drag: function(e) {
          _this.sliderY = e.clientY - _this.el.offset().top - _this.offsetY;
          _this.scroll();
          return false;
        },
        up: function(e) {
          _this.isDrag = false;
          _this.pane.removeClass('active');
          $(document).unbind(MOUSEMOVE, _this.events[DRAG]);
          $(document).unbind(MOUSEUP, _this.events[UP]);
          return false;
        },
        resize: function(e) {
          _this.reset();
        },
        panedown: function(e) {
          _this.sliderY = e.clientY - _this.el.offset().top - _this.sliderH * 0.5;
          _this.scroll();
          _this.events.down(e);
        },
        scroll: function(e) {
          var content, top;
          content = _this.content[0];
          if (_this.isDrag === true) return;
          top = content.scrollTop / (content.scrollHeight - content.clientHeight) * (_this.paneH - _this.sliderH);
          _this.slider.css({
            top: top + 'px'
          });
        },
        wheel: function(e) {
          _this.sliderY += -e.wheelDeltaY || -e.delta;
          _this.scroll();
          return false;
        }
      };
    };

    NanoScroll.prototype.addEvents = function() {
      var events, pane;
      events = this.events;
      pane = this.pane;
      $(window).bind(RESIZE, events[RESIZE]);
      this.slider.bind(MOUSEDOWN, events[DOWN]);
      pane.bind(MOUSEDOWN, events[PANEDOWN]);
      this.content.bind(SCROLL, events[SCROLL]);
      if (window.addEventListener) {
        pane = pane[0];
        pane.addEventListener(MOUSEWHEEL, events[WHEEL], false);
        pane.addEventListener(DOMSCROLL, events[WHEEL], false);
      }
    };

    NanoScroll.prototype.removeEvents = function() {
      var events, pane;
      events = this.events;
      pane = this.pane;
      $(window).unbind(RESIZE, events[RESIZE]);
      this.slider.unbind(MOUSEDOWN, events[DOWN]);
      pane.unbind(MOUSEDOWN, events[PANEDOWN]);
      this.content.unbind(SCROLL, events[SCROLL]);
      if (window.addEventListener) {
        pane = pane[0];
        pane.removeEventListener(MOUSEWHEEL, events[WHEEL], false);
        pane.removeEventListener(DOMSCROLL, events[WHEEL], false);
      }
    };

    NanoScroll.prototype.generate = function() {
      this.el.append('<div class="pane"><div class="slider"></div></div>');
      this.content = $(this.el.children()[0]);
      this.slider = this.el.find('.slider');
      this.pane = this.el.find('.pane');
      this.scrollW = getScrollbarWidth();
      if (this.scrollbarWidth === 0) this.scrollW = 0;
      this.content.css({
        right: -this.scrollW + 'px'
      });
    };

    NanoScroll.prototype.reset = function() {
      if (this.isDead === true) {
        this.isDead = false;
        this.pane.show();
        this.addEvents();
      }
      this.contentH = this.content[0].scrollHeight + this.scrollW;
      this.paneH = this.pane.outerHeight();
      this.sliderH = this.paneH / this.contentH * this.paneH;
      this.sliderH = Math.round(this.sliderH);

      this.scrollH = this.paneH - this.sliderH;
      this.slider.height(this.sliderH);

      console.warn('reseting', this.sliderH)
      if (this.paneH >= this.content[0].scrollHeight) {
        this.pane.hide();
      } else {
        this.pane.show();
      }
    };

    NanoScroll.prototype.scroll = function() {
      var scrollValue;
      this.sliderY = Math.max(0, this.sliderY);
      this.sliderY = Math.min(this.scrollH, this.sliderY);
      scrollValue = this.paneH - this.contentH + this.scrollW;
      scrollValue = scrollValue * this.sliderY / this.scrollH;
      this.content.scrollTop(-scrollValue);
      return this.slider.css({
        top: this.sliderY
      });
    };

    NanoScroll.prototype.scrollBottom = function(offsetY) {
      this.reset();
      this.content.scrollTop(this.contentH - this.content.height() - offsetY);
    };

    NanoScroll.prototype.scrollTop = function(offsetY) {
      this.reset();
      this.content.scrollTop(offsetY + 0);
    };

    NanoScroll.prototype.stop = function() {
      this.isDead = true;
      this.removeEvents();
      this.pane.hide();
    };

    return NanoScroll;

  })();

  ["Left", "Top"].forEach(function(name, i) {
    var method = "scroll" + name;

    function isWindow( obj ) {
        return obj && typeof obj === "object" && "setInterval" in obj;
    }

    function getWindow( elem ) {
      return isWindow( elem ) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;
    }

    $.fn[ method ] = function( val ) {
      var elem, win;

      if ( val === undefined ) {

        elem = this[ 0 ];

        if ( !elem ) {
          return null;
        }

        win = getWindow( elem );

        // Return the scroll offset
        return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
            win.document.documentElement[ method ] ||
            win.document.body[ method ] :
            elem[ method ];
      }

      // Set the scroll offset
      this.each(function() {
        win = getWindow( this );

        if ( win ) {
          var xCoord = !i ? val : $( win ).scrollLeft();
          var yCoord = i ? val : $( win ).scrollTop();
          win.scrollTo(xCoord, yCoord);
        } else {
          this[ method ] = val;
        }
      });
    }
  });

    // Used by colorslider.js
  ['width', 'height'].forEach(function(dimension) {
    var offset, Dimension = dimension.replace(/./, function(m) { return m[0].toUpperCase() });
    $.fn['outer' + Dimension] = function(margin) {
      var elem = this;
      if (elem) {
        var size = elem[dimension]();
        var sides = {'width': ['left', 'right'], 'height': ['top', 'bottom']};
        sides[dimension].forEach(function(side) {
          if (margin) size += parseInt(elem.css('margin-' + side), 10);
        });
        return size;
      } else {
        return null;
      }
    };
  });

  $.fn.nanoScroller = function(options) {
    options || (options = {});
    if (!($.browser.msie && parseInt($.browser.version, 10) < 8)) {
      return this.each(function() {
        var scrollbar;

        $this = $(this);
        scrollbar = this[SCROLLBAR];
        if (!scrollbar) {
          scrollbar = new NanoScroll($this);
          this[SCROLLBAR] = scrollbar;
        }

        if (options.scrollBottom) {
          return scrollbar.scrollBottom(options.scrollBottom);
        }
        if (options.scrollTop) return scrollbar.scrollTop(options.scrollTop);
        if (options.scroll === 'bottom') return scrollbar.scrollBottom(0);
        if (options.scroll === 'top') return scrollbar.scrollTop(0);
        if (options.stop) return scrollbar.stop();

        scrollbar.reset();
      })
    }
  };
})(window.jQuery||window.Zepto, window, document);
// File: ./lib/handlebars.js
// lib/handlebars/parser.js
/* Jison generated parser */
var handlebars = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"program":4,"EOF":5,"statements":6,"simpleInverse":7,"statement":8,"openInverse":9,"closeBlock":10,"openBlock":11,"mustache":12,"partial":13,"CONTENT":14,"COMMENT":15,"OPEN_BLOCK":16,"inMustache":17,"CLOSE":18,"OPEN_INVERSE":19,"OPEN_ENDBLOCK":20,"path":21,"OPEN":22,"OPEN_UNESCAPED":23,"OPEN_PARTIAL":24,"params":25,"hash":26,"param":27,"STRING":28,"INTEGER":29,"BOOLEAN":30,"hashSegments":31,"hashSegment":32,"ID":33,"EQUALS":34,"pathSegments":35,"SEP":36,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"OPEN_PARTIAL",28:"STRING",29:"INTEGER",30:"BOOLEAN",33:"ID",34:"EQUALS",36:"SEP"},
productions_: [0,[3,2],[4,3],[4,1],[4,0],[6,1],[6,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,3],[13,4],[7,2],[17,3],[17,2],[17,2],[17,1],[25,2],[25,1],[27,1],[27,1],[27,1],[27,1],[26,1],[31,2],[31,1],[32,3],[32,3],[32,3],[32,3],[21,1],[35,3],[35,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1] 
break;
case 2: this.$ = new yy.ProgramNode($$[$0-2], $$[$0]) 
break;
case 3: this.$ = new yy.ProgramNode($$[$0]) 
break;
case 4: this.$ = new yy.ProgramNode([]) 
break;
case 5: this.$ = [$$[$0]] 
break;
case 6: $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 7: this.$ = new yy.InverseNode($$[$0-2], $$[$0-1], $$[$0]) 
break;
case 8: this.$ = new yy.BlockNode($$[$0-2], $$[$0-1], $$[$0]) 
break;
case 9: this.$ = $$[$0] 
break;
case 10: this.$ = $$[$0] 
break;
case 11: this.$ = new yy.ContentNode($$[$0]) 
break;
case 12: this.$ = new yy.CommentNode($$[$0]) 
break;
case 13: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 14: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 15: this.$ = $$[$0-1] 
break;
case 16: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 17: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], true) 
break;
case 18: this.$ = new yy.PartialNode($$[$0-1]) 
break;
case 19: this.$ = new yy.PartialNode($$[$0-2], $$[$0-1]) 
break;
case 20: 
break;
case 21: this.$ = [[$$[$0-2]].concat($$[$0-1]), $$[$0]] 
break;
case 22: this.$ = [[$$[$0-1]].concat($$[$0]), null] 
break;
case 23: this.$ = [[$$[$0-1]], $$[$0]] 
break;
case 24: this.$ = [[$$[$0]], null] 
break;
case 25: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
break;
case 26: this.$ = [$$[$0]] 
break;
case 27: this.$ = $$[$0] 
break;
case 28: this.$ = new yy.StringNode($$[$0]) 
break;
case 29: this.$ = new yy.IntegerNode($$[$0]) 
break;
case 30: this.$ = new yy.BooleanNode($$[$0]) 
break;
case 31: this.$ = new yy.HashNode($$[$0]) 
break;
case 32: $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 33: this.$ = [$$[$0]] 
break;
case 34: this.$ = [$$[$0-2], $$[$0]] 
break;
case 35: this.$ = [$$[$0-2], new yy.StringNode($$[$0])] 
break;
case 36: this.$ = [$$[$0-2], new yy.IntegerNode($$[$0])] 
break;
case 37: this.$ = [$$[$0-2], new yy.BooleanNode($$[$0])] 
break;
case 38: this.$ = new yy.IdNode($$[$0]) 
break;
case 39: $$[$0-2].push($$[$0]); this.$ = $$[$0-2]; 
break;
case 40: this.$ = [$$[$0]] 
break;
}
},
table: [{3:1,4:2,5:[2,4],6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],24:[1,15]},{1:[3]},{5:[1,16]},{5:[2,3],7:17,8:18,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,19],20:[2,3],22:[1,13],23:[1,14],24:[1,15]},{5:[2,5],14:[2,5],15:[2,5],16:[2,5],19:[2,5],20:[2,5],22:[2,5],23:[2,5],24:[2,5]},{4:20,6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],24:[1,15]},{4:21,6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],24:[1,15]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],24:[2,9]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],24:[2,10]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],24:[2,11]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],24:[2,12]},{17:22,21:23,33:[1,25],35:24},{17:26,21:23,33:[1,25],35:24},{17:27,21:23,33:[1,25],35:24},{17:28,21:23,33:[1,25],35:24},{21:29,33:[1,25],35:24},{1:[2,1]},{6:30,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],24:[1,15]},{5:[2,6],14:[2,6],15:[2,6],16:[2,6],19:[2,6],20:[2,6],22:[2,6],23:[2,6],24:[2,6]},{17:22,18:[1,31],21:23,33:[1,25],35:24},{10:32,20:[1,33]},{10:34,20:[1,33]},{18:[1,35]},{18:[2,24],21:40,25:36,26:37,27:38,28:[1,41],29:[1,42],30:[1,43],31:39,32:44,33:[1,45],35:24},{18:[2,38],28:[2,38],29:[2,38],30:[2,38],33:[2,38],36:[1,46]},{18:[2,40],28:[2,40],29:[2,40],30:[2,40],33:[2,40],36:[2,40]},{18:[1,47]},{18:[1,48]},{18:[1,49]},{18:[1,50],21:51,33:[1,25],35:24},{5:[2,2],8:18,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,2],22:[1,13],23:[1,14],24:[1,15]},{14:[2,20],15:[2,20],16:[2,20],19:[2,20],22:[2,20],23:[2,20],24:[2,20]},{5:[2,7],14:[2,7],15:[2,7],16:[2,7],19:[2,7],20:[2,7],22:[2,7],23:[2,7],24:[2,7]},{21:52,33:[1,25],35:24},{5:[2,8],14:[2,8],15:[2,8],16:[2,8],19:[2,8],20:[2,8],22:[2,8],23:[2,8],24:[2,8]},{14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],24:[2,14]},{18:[2,22],21:40,26:53,27:54,28:[1,41],29:[1,42],30:[1,43],31:39,32:44,33:[1,45],35:24},{18:[2,23]},{18:[2,26],28:[2,26],29:[2,26],30:[2,26],33:[2,26]},{18:[2,31],32:55,33:[1,56]},{18:[2,27],28:[2,27],29:[2,27],30:[2,27],33:[2,27]},{18:[2,28],28:[2,28],29:[2,28],30:[2,28],33:[2,28]},{18:[2,29],28:[2,29],29:[2,29],30:[2,29],33:[2,29]},{18:[2,30],28:[2,30],29:[2,30],30:[2,30],33:[2,30]},{18:[2,33],33:[2,33]},{18:[2,40],28:[2,40],29:[2,40],30:[2,40],33:[2,40],34:[1,57],36:[2,40]},{33:[1,58]},{14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],24:[2,13]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],24:[2,16]},{5:[2,17],14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],24:[2,17]},{5:[2,18],14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],24:[2,18]},{18:[1,59]},{18:[1,60]},{18:[2,21]},{18:[2,25],28:[2,25],29:[2,25],30:[2,25],33:[2,25]},{18:[2,32],33:[2,32]},{34:[1,57]},{21:61,28:[1,62],29:[1,63],30:[1,64],33:[1,25],35:24},{18:[2,39],28:[2,39],29:[2,39],30:[2,39],33:[2,39],36:[2,39]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],24:[2,19]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],24:[2,15]},{18:[2,34],33:[2,34]},{18:[2,35],33:[2,35]},{18:[2,36],33:[2,36]},{18:[2,37],33:[2,37]}],
defaultActions: {16:[2,1],37:[2,23],53:[2,21]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+'\nExpecting '+expected.join(', ');
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};/* Jison generated lexer */
var lexer = (function(){var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            match = this._input.match(this.rules[rules[i]]);
            if (match) {
                lines = match[0].match(/\n.*/g);
                if (lines) this.yylineno += lines.length;
                this.yylloc = {first_line: this.yylloc.last_line,
                               last_line: this.yylineno+1,
                               first_column: this.yylloc.last_column,
                               last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, rules[i],this.conditionStack[this.conditionStack.length-1]);
                if (token) return token;
                else return;
            }
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    }});
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0: this.begin("mu"); if (yy_.yytext) return 14; 
break;
case 1: return 14; 
break;
case 2: return 24; 
break;
case 3: return 16; 
break;
case 4: return 20; 
break;
case 5: return 19; 
break;
case 6: return 19; 
break;
case 7: return 23; 
break;
case 8: return 23; 
break;
case 9: yy_.yytext = yy_.yytext.substr(3,yy_.yyleng-5); this.begin("INITIAL"); return 15; 
break;
case 10: return 22; 
break;
case 11: return 34; 
break;
case 12: return 33; 
break;
case 13: return 33; 
break;
case 14: return 36; 
break;
case 15: /*ignore whitespace*/ 
break;
case 16: this.begin("INITIAL"); return 18; 
break;
case 17: this.begin("INITIAL"); return 18; 
break;
case 18: yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2).replace(/\\"/g,'"'); return 28; 
break;
case 19: return 30; 
break;
case 20: return 30; 
break;
case 21: return 29; 
break;
case 22: return 33; 
break;
case 23: return 'INVALID'; 
break;
case 24: return 5; 
break;
}
};
lexer.rules = [/^[^\x00]*?(?=(\{\{))/,/^[^\x00]+/,/^\{\{>/,/^\{\{#/,/^\{\{\//,/^\{\{\^/,/^\{\{\s*else\b/,/^\{\{\{/,/^\{\{&/,/^\{\{![\s\S]*?\}\}/,/^\{\{/,/^=/,/^\.(?=[} ])/,/^\.\./,/^[/.]/,/^\s+/,/^\}\}\}/,/^\}\}/,/^"(\\["]|[^"])*"/,/^true(?=[}\s])/,/^false(?=[}\s])/,/^[0-9]+(?=[}\s])/,/^[a-zA-Z0-9_$-]+(?=[=}\s/.])/,/^./,/^$/];
lexer.conditions = {"mu":{"rules":[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],"inclusive":false},"INITIAL":{"rules":[0,1,24],"inclusive":true}};return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = handlebars;
exports.parse = function () { return handlebars.parse.apply(handlebars, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
};
;
// lib/handlebars/base.js
var Handlebars = {};

Handlebars.VERSION = "1.0.beta.2";

Handlebars.Parser = handlebars;

Handlebars.parse = function(string) {
  Handlebars.Parser.yy = Handlebars.AST;
  return Handlebars.Parser.parse(string);
};

Handlebars.print = function(ast) {
  return new Handlebars.PrintVisitor().accept(ast);
};

Handlebars.helpers  = {};
Handlebars.partials = {};

Handlebars.registerHelper = function(name, fn, inverse) {
  if(inverse) { fn.not = inverse; }
  this.helpers[name] = fn;
};

Handlebars.registerPartial = function(name, str) {
  this.partials[name] = str;
};

Handlebars.registerHelper('helperMissing', function(arg) {
  if(arguments.length === 2) {
    return undefined;
  } else {
    throw new Error("Could not find property '" + arg + "'");
  }
});

Handlebars.registerHelper('blockHelperMissing', function(context, fn, inverse) {
  inverse = inverse || function() {};

  var ret = "";
  var type = Object.prototype.toString.call(context);

  if(type === "[object Function]") {
    context = context();
  }

  if(context === true) {
    return fn(this);
  } else if(context === false || context == null) {
    return inverse(this);
  } else if(type === "[object Array]") {
    if(context.length > 0) {
      for(var i=0, j=context.length; i<j; i++) {
        ret = ret + fn(context[i]);
      }
    } else {
      ret = inverse(this);
    }
    return ret;
  } else {
    return fn(context);
  }
}, function(context, fn) {
  return fn(context);
});

Handlebars.registerHelper('each', function(context, fn, inverse) {
  var ret = "";

  if(context && context.length > 0) {
    for(var i=0, j=context.length; i<j; i++) {
      ret = ret + fn(context[i]);
    }
  } else {
    ret = inverse(this);
  }
  return ret;
});

Handlebars.registerHelper('if', function(context, fn, inverse) {
  if(!context || context == []) {
    return inverse(this);
  } else {
    return fn(this);
  }
});

Handlebars.registerHelper('unless', function(context, fn, inverse) {
  return Handlebars.helpers['if'].call(this, context, inverse, fn);
});

Handlebars.registerHelper('with', function(context, fn) {
  return fn(context);
});

Handlebars.logger = {
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, level: 3,

  // override in the host environment
  log: function(level, str) {}
};

Handlebars.log = function(level, str) { Handlebars.logger.log(level, str); };
;
// lib/handlebars/ast.js
(function() {

  Handlebars.AST = {};

  Handlebars.AST.ProgramNode = function(statements, inverse) {
    this.type = "program";
    this.statements = statements;
    if(inverse) { this.inverse = new Handlebars.AST.ProgramNode(inverse); }
  };

  Handlebars.AST.MustacheNode = function(params, hash, unescaped) {
    this.type = "mustache";
    this.id = params[0];
    this.params = params.slice(1);
    this.hash = hash;
    this.escaped = !unescaped;
  };

  Handlebars.AST.PartialNode = function(id, context) {
    this.type    = "partial";

    // TODO: disallow complex IDs

    this.id      = id;
    this.context = context;
  };

  var verifyMatch = function(open, close) {
    if(open.original !== close.original) {
      throw new Handlebars.Exception(open.original + " doesn't match " + close.original);
    }
  };

  Handlebars.AST.BlockNode = function(mustache, program, close) {
    verifyMatch(mustache.id, close);
    this.type = "block";
    this.mustache = mustache;
    this.program  = program;
  };

  Handlebars.AST.InverseNode = function(mustache, program, close) {
    verifyMatch(mustache.id, close);
    this.type = "inverse";
    this.mustache = mustache;
    this.program  = program;
  };

  Handlebars.AST.ContentNode = function(string) {
    this.type = "content";
    this.string = string;
  };

  Handlebars.AST.HashNode = function(pairs) {
    this.type = "hash";
    this.pairs = pairs;
  };

  Handlebars.AST.IdNode = function(parts) {
    this.type = "ID";
    this.original = parts.join(".");

    var dig = [], depth = 0;

    for(var i=0,l=parts.length; i<l; i++) {
      var part = parts[i];

      if(part === "..") { depth++; }
      else if(part === "." || part === "this") { continue; }
      else { dig.push(part); }
    }

    this.parts    = dig;
    this.string   = dig.join('.');
    this.depth    = depth;
    this.isSimple = (dig.length === 1) && (depth === 0);
  };

  Handlebars.AST.StringNode = function(string) {
    this.type = "STRING";
    this.string = string;
  };

  Handlebars.AST.IntegerNode = function(integer) {
    this.type = "INTEGER";
    this.integer = integer;
  };

  Handlebars.AST.BooleanNode = function(boolean) {
    this.type = "BOOLEAN";
    this.boolean = boolean;
  };

  Handlebars.AST.CommentNode = function(comment) {
    this.type = "comment";
    this.comment = comment;
  };

})();;
// lib/handlebars/visitor.js

Handlebars.Visitor = function() {};

Handlebars.Visitor.prototype = {
  accept: function(object) {
    return this[object.type](object);
  }
};;
// lib/handlebars/utils.js
Handlebars.Exception = function(message) {
  this.message = message;
};

// Build out our basic SafeString type
Handlebars.SafeString = function(string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function() {
  return this.string.toString();
};

(function() {
  var escape = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /&(?!\w+;)|[<>"'`]/g;
  var possible = /[&<>"'`]/;

  var escapeChar = function(chr) {
    return escape[chr] || "&amp;"
  };

  Handlebars.Utils = {
    escapeExpression: function(string) {
      // don't escape SafeStrings, since they're already safe
      if (string instanceof Handlebars.SafeString) {
        return string.toString();
      } else if (string == null || string === false) {
        return "";
      }

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    },

    isEmpty: function(value) {
      if (typeof value === "undefined") {
        return true;
      } else if (value === null) {
        return true;
      } else if (value === false) {
        return true;
      } else if(Object.prototype.toString.call(value) === "[object Array]" && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }
  };
})();;
// lib/handlebars/compiler.js
Handlebars.Compiler = function() {};
Handlebars.JavaScriptCompiler = function() {};

(function(Compiler, JavaScriptCompiler) {
  Compiler.OPCODE_MAP = {
    appendContent: 1,
    getContext: 2,
    lookupWithHelpers: 3,
    lookup: 4,
    append: 5,
    invokeMustache: 6,
    appendEscaped: 7,
    pushString: 8,
    truthyOrFallback: 9,
    functionOrFallback: 10,
    invokeProgram: 11,
    invokePartial: 12,
    push: 13,
    invokeInverse: 14,
    assignToHash: 15,
    pushStringParam: 16
  };

  Compiler.MULTI_PARAM_OPCODES = {
    appendContent: 1,
    getContext: 1,
    lookupWithHelpers: 1,
    lookup: 1,
    invokeMustache: 2,
    pushString: 1,
    truthyOrFallback: 1,
    functionOrFallback: 1,
    invokeProgram: 2,
    invokePartial: 1,
    push: 1,
    invokeInverse: 1,
    assignToHash: 1,
    pushStringParam: 1
  };

  Compiler.DISASSEMBLE_MAP = {};

  for(var prop in Compiler.OPCODE_MAP) {
    var value = Compiler.OPCODE_MAP[prop];
    Compiler.DISASSEMBLE_MAP[value] = prop;
  }

  Compiler.multiParamSize = function(code) {
    return Compiler.MULTI_PARAM_OPCODES[Compiler.DISASSEMBLE_MAP[code]];
  };

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, nextCode;
      var out = [], str, name, value;

      for(var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if(opcode === 'DECLARE') {
          name = opcodes[++i];
          value = opcodes[++i];
          out.push("DECLARE " + name + " = " + value);
        } else {
          str = Compiler.DISASSEMBLE_MAP[opcode];

          var extraParams = Compiler.multiParamSize(opcode);
          var codes = [];

          for(var j=0; j<extraParams; j++) {
            nextCode = opcodes[++i];

            if(typeof nextCode === "string") {
              nextCode = "\"" + nextCode.replace("\n", "\\n") + "\"";
            }

            codes.push(nextCode);
          }

          str = str + " " + codes.join(" ");

          out.push(str);
        }
      }

      return out.join("\n");
    },

    guid: 0,

    compile: function(program, options) {
      this.children = [];
      this.depths = {list: []};
      this.options = options || {};
      return this.program(program);
    },

    accept: function(node) {
      return this[node.type](node);
    },

    program: function(program) {
      var statements = program.statements, statement;
      this.opcodes = [];

      for(var i=0, l=statements.length; i<l; i++) {
        statement = statements[i];
        this[statement.type](statement);
      }

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache;
      var depth, child, inverse, inverseGuid;

      var params = this.setupStackForMustache(mustache);

      var programGuid = this.compileProgram(block.program);

      if(block.program.inverse) {
        inverseGuid = this.compileProgram(block.program.inverse);
        this.declare('inverse', inverseGuid);
      }

      this.opcode('invokeProgram', programGuid, params.length);
      this.declare('inverse', null);
      this.opcode('append');
    },

    inverse: function(block) {
      this.ID(block.mustache.id);
      var programGuid = this.compileProgram(block.program);

      this.opcode('invokeInverse', programGuid);
      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('push', '{}');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        this.accept(val);
        this.opcode('assignToHash', pair[0]);
      }
    },

    partial: function(partial) {
      var id = partial.id;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'context');
      }

      this.opcode('invokePartial', id.original);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      var params = this.setupStackForMustache(mustache);

      this.opcode('invokeMustache', params.length, mustache.id.original);

      if(mustache.escaped) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);

      this.opcode('getContext', id.depth);

      this.opcode('lookupWithHelpers', id.parts[0] || null);

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('push', integer.integer);
    },

    BOOLEAN: function(boolean) {
      this.opcode('push', boolean.boolean);
    },

    comment: function() {},

    // HELPERS
    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.string);
        } else {
          this[param.type](param);
        }
      }
    },

    opcode: function(name, val1, val2) {
      this.opcodes.push(Compiler.OPCODE_MAP[name]);
      if(val1 !== undefined) { this.opcodes.push(val1); }
      if(val2 !== undefined) { this.opcodes.push(val2); }
    },

    declare: function(name, value) {
      this.opcodes.push('DECLARE');
      this.opcodes.push(name);
      this.opcodes.push(value);
    },

    addDepth: function(depth) {
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    setupStackForMustache: function(mustache) {
      var params = mustache.params;

      this.pushParams(params);

      if(mustache.hash) {
        this.hash(mustache.hash);
      } else {
        this.opcode('push', '{}');
      }

      this.ID(mustache.id);

      return params;
    }
  };

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name, type) {
      if(JavaScriptCompiler.RESERVED_WORDS[name] || name.indexOf('-') !== -1 || !isNaN(name)) {
        return parent + "['" + name + "']";
      } else if (/^[0-9]+$/.test(name)) {
        return parent + "[" + name + "]";
      } else {
        return parent + "." + name;
      }
    },

    appendToBuffer: function(string) {
      return "buffer = buffer + " + string + ";";
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },
    // END PUBLIC API

    compile: function(environment, options) {
      this.environment = environment;
      this.options = options || {};

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];
      this.registers = {list: []};

      this.compileChildren(environment, options);

      Handlebars.log(Handlebars.logger.DEBUG, environment.disassemble() + "\n\n");

      var opcodes = environment.opcodes, opcode, name, declareName, declareVal;

      this.i = 0;

      for(l=opcodes.length; this.i<l; this.i++) {
        opcode = this.nextOpcode(0);

        if(opcode[0] === 'DECLARE') {
          this.i = this.i + 2;
          this[opcode[1]] = opcode[2];
        } else {
          this.i = this.i + opcode[1].length;
          this[opcode[0]].apply(this, opcode[1]);
        }
      }

      return this.createFunction();
    },

    nextOpcode: function(n) {
      var opcodes = this.environment.opcodes, opcode = opcodes[this.i + n], name, val;
      var extraParams, codes;

      if(opcode === 'DECLARE') {
        name = opcodes[this.i + 1];
        val  = opcodes[this.i + 2];
        return ['DECLARE', name, val];
      } else {
        name = Compiler.DISASSEMBLE_MAP[opcode];

        extraParams = Compiler.multiParamSize(opcode);
        codes = [];

        for(var j=0; j<extraParams; j++) {
          codes.push(opcodes[this.i + j + 1 + n]);
        }

        return [name, codes];
      }
    },

    eat: function(opcode) {
      this.i = this.i + opcode.length;
    },

    preamble: function() {
      var out = [];
      out.push("var buffer = " + this.initializeBuffer() + ", currentContext = context");

      var copies = "helpers = helpers || Handlebars.helpers;";
      if(this.environment.usePartial) { copies = copies + " partials = partials || Handlebars.partials;"; }
      out.push(copies);

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunction: function() {
      var container = {
        escapeExpression: Handlebars.Utils.escapeExpression,
        invokePartial: Handlebars.VM.invokePartial,
        programs: [],
        program: function(i, helpers, partials, data) {
          var programWrapper = this.programs[i];
          if(data) {
            return Handlebars.VM.program(this.children[i], helpers, partials, data);
          } else if(programWrapper) {
            return programWrapper;
          } else {
            programWrapper = this.programs[i] = Handlebars.VM.program(this.children[i], helpers, partials);
            return programWrapper;
          }
        },
        programWithDepth: Handlebars.VM.programWithDepth,
        noop: Handlebars.VM.noop
      };
      var locals = this.stackVars.concat(this.registers.list);

      if(locals.length > 0) {
        this.source[0] = this.source[0] + ", " + locals.join(", ");
      }

      this.source[0] = this.source[0] + ";";

      this.source.push("return buffer;");

      var params = ["Handlebars", "context", "helpers", "partials"];

      if(this.options.data) { params.push("data"); }

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      if(params.length === 4 && !this.environment.usePartial) { params.pop(); }

      params.push(this.source.join("\n"));

      var fn = Function.apply(this, params);
      fn.displayName = "Handlebars.js";

      Handlebars.log(Handlebars.logger.DEBUG, fn.toString() + "\n\n");

      container.render = fn;

      container.children = this.environment.children;

      return function(context, options, $depth) {
        try {
          options = options || {};
          var args = [Handlebars, context, options.helpers, options.partials, options.data];
          var depth = Array.prototype.slice.call(arguments, 2);
          args = args.concat(depth);

          return container.render.apply(container, args);
        } catch(e) {
          throw e;
        }
      };
    },

    appendContent: function(content) {
      this.source.push(this.appendToBuffer(this.quotedString(content)));
    },

    append: function() {
      var local = this.popStack();
      this.source.push("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
    },

    appendEscaped: function() {
      var opcode = this.nextOpcode(1), extra = "";

      if(opcode[0] === 'appendContent') {
        extra = " + " + this.quotedString(opcode[1][0]);
        this.eat(opcode);
      }

      this.source.push(this.appendToBuffer("this.escapeExpression(" + this.popStack() + ")" + extra));
    },

    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;

        if(depth === 0) {
          this.source.push("currentContext = context;");
        } else {
          this.source.push("currentContext = depth" + depth + ";");
        }
      }
    },

    lookupWithHelpers: function(name) {
      if(name) {
        var topStack = this.nextStack();

        var toPush =  "if('" + name + "' in helpers) { " + topStack +
                      " = " + this.nameLookup('helpers', name, 'helper') +
                      "; } else { " + topStack + " = " +
                      this.nameLookup('currentContext', name, 'context') +
                      "; }";

        this.source.push(toPush);
      } else {
        this.pushStack("currentContext");
      }
    },

    lookup: function(name) {
      var topStack = this.topStack();
      this.source.push(topStack + " = " + this.nameLookup(topStack, name, 'context') + ";");
    },

    pushStringParam: function(string) {
      this.pushStack("currentContext");
      this.pushString(string);
    },

    pushString: function(string) {
      this.pushStack(this.quotedString(string));
    },

    push: function(name) {
      this.pushStack(name);
    },

    invokeMustache: function(paramSize, original) {
      this.populateParams(paramSize, this.quotedString(original), "{}", null, function(nextStack, helperMissingString, id) {
        this.source.push("else if(" + id + "=== undefined) { " + nextStack + " = helpers.helperMissing.call(" + helperMissingString + "); }");
        this.source.push("else { " + nextStack + " = " + id + "; }");
      });
    },

    invokeProgram: function(guid, paramSize) {
      var inverse = this.programExpression(this.inverse);
      var mainProgram = this.programExpression(guid);

      this.populateParams(paramSize, null, mainProgram, inverse, function(nextStack, helperMissingString, id) {
        this.source.push("else { " + nextStack + " = helpers.blockHelperMissing.call(" + helperMissingString + "); }");
      });
    },

    populateParams: function(paramSize, helperId, program, inverse, fn) {
      var id = this.popStack(), nextStack;
      var params = [], param, stringParam;

      var hash = this.popStack();

      this.register('tmp1', program);
      this.source.push('tmp1.hash = ' + hash + ';');

      if(this.options.stringParams) {
        this.source.push('tmp1.contexts = [];');
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          this.source.push('tmp1.contexts.push(' + this.popStack() + ');');
        }
      }

      if(inverse) {
        this.source.push('tmp1.fn = tmp1;');
        this.source.push('tmp1.inverse = ' + inverse + ';');
      }

      if(this.options.data) {
        this.source.push('tmp1.data = data;');
      }

      params.push('tmp1');

      // TODO: This is legacy behavior. Deprecate and remove.
      if(inverse) {
        params.push(inverse);
      }

      this.populateCall(params, id, helperId || id, fn);
    },

    populateCall: function(params, id, helperId, fn) {
      var paramString = ["context"].concat(params).join(", ");
      var helperMissingString = ["context"].concat(helperId).concat(params).join(", ");

      nextStack = this.nextStack();

      this.source.push("if(typeof " + id + " === 'function') { " + nextStack + " = " + id + ".call(" + paramString + "); }");
      fn.call(this, nextStack, helperMissingString, id);
    },

    invokeInverse: function(guid) {
      var program = this.programExpression(guid);

      var blockMissingParams = ["context", this.topStack(), "this.noop", program];
      this.pushStack("helpers.blockHelperMissing.call(" + blockMissingParams.join(", ") + ")");
    },

    invokePartial: function(context) {
      this.pushStack("this.invokePartial(" + this.nameLookup('partials', context, 'partial') + ", '" + context + "', " + this.popStack() + ", helpers, partials);");
    },

    assignToHash: function(key) {
      var value = this.popStack();
      var hash = this.topStack();

      this.source.push(hash + "['" + key + "'] = " + value + ";");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;
      var compiled = [];

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        compiled[i] = compiler.compile(child, options);
      }

      environment.rawChildren = children;
      environment.children = compiled;
    },

    programExpression: function(guid) {
      if(guid == null) { return "this.noop"; }

      var programParams = [guid, "helpers", "partials"];

      var depths = this.environment.rawChildren[guid].depths.list;

      if(this.options.data) { programParams.push("data"); }

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("context"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      if(!this.environment.usePartial) {
        if(programParams[3]) {
          programParams[2] = "null";
        } else {
          programParams.pop();
        }
      }

      if(depths.length === 0) {
        return "this.program(" + programParams.join(", ") + ")";
      } else {
        programParams[0] = "this.children[" + guid + "]";
        return "this.programWithDepth(" + programParams.join(", ") + ")";
      }
    },

    register: function(name, val) {
      this.useRegister(name);
      this.source.push(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },

    pushStack: function(item) {
      this.source.push(this.nextStack() + " = " + item + ";");
      return "stack" + this.stackSlot;
    },

    nextStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return "stack" + this.stackSlot;
    },

    popStack: function() {
      return "stack" + this.stackSlot--;
    },

    topStack: function() {
      return "stack" + this.stackSlot;
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r') + '"';
    }
  };

  var reservedWords = ("break case catch continue default delete do else finally " +
                       "for function if in instanceof new return switch this throw " + 
                       "try typeof var void while with null true false").split(" ");

  compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

})(Handlebars.Compiler, Handlebars.JavaScriptCompiler);

Handlebars.VM = {
  programWithDepth: function(fn, helpers, partials, data, $depth) {
    var args = Array.prototype.slice.call(arguments, 4);

    return function(context, options) {
      options = options || {};

      options = {
        helpers: options.helpers || helpers,
        partials: options.partials || partials,
        data: options.data || data
      };

      return fn.apply(this, [context, options].concat(args));
    };
  },
  program: function(fn, helpers, partials, data) {
    return function(context, options) {
      options = options || {};

      return fn(context, {
        helpers: options.helpers || helpers,
        partials: options.partials || partials,
        data: options.data || data
      });
    };
  },
  noop: function() { return ""; },
  compile: function(string, options) {
    var ast = Handlebars.parse(string);
    var environment = new Handlebars.Compiler().compile(ast, options);
    return new Handlebars.JavaScriptCompiler().compile(environment, options);
  },
  invokePartial: function(partial, name, context, helpers, partials) {
    if(partial === undefined) {
      throw new Handlebars.Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, {helpers: helpers, partials: partials});
    } else {
      partials[name] = Handlebars.VM.compile(partial);
      return partials[name](context, {helpers: helpers, partials: partials});
    }
  }
};

Handlebars.compile = Handlebars.VM.compile;;

// File: ./lib/spin.min.js
//fgnass.github.com/spin.js#v1.2.1
(function(a,b,c){function n(a){var b={x:a.offsetLeft,y:a.offsetTop};while(a=a.offsetParent)b.x+=a.offsetLeft,b.y+=a.offsetTop;return b}function m(a,b){for(var d in b)a[d]===c&&(a[d]=b[d]);return a}function l(a,b){for(var c in b)a.style[k(a,c)||c]=b[c];return a}function k(a,b){var e=a.style,f,g;if(e[b]!==c)return b;b=b.charAt(0).toUpperCase()+b.slice(1);for(g=0;g<d.length;g++){f=d[g]+b;if(e[f]!==c)return f}}function j(a,b,c,d){var g=["opacity",b,~~(a*100),c,d].join("-"),h=.01+c/d*100,j=Math.max(1-(1-a)/b*(100-h),a),k=f.substring(0,f.indexOf("Animation")).toLowerCase(),l=k&&"-"+k+"-"||"";e[g]||(i.insertRule("@"+l+"keyframes "+g+"{"+"0%{opacity:"+j+"}"+h+"%{opacity:"+a+"}"+(h+.01)+"%{opacity:1}"+(h+b)%100+"%{opacity:"+a+"}"+"100%{opacity:"+j+"}"+"}",0),e[g]=1);return g}function h(a,b,c){c&&!c.parentNode&&h(a,c),a.insertBefore(b,c||null);return a}function g(a,c){var d=b.createElement(a||"div"),e;for(e in c)d[e]=c[e];return d}var d=["webkit","Moz","ms","O"],e={},f;h(b.getElementsByTagName("head")[0],g("style"));var i=b.styleSheets[b.styleSheets.length-1],o=function q(a){if(!this.spin)return new q(a);this.opts=m(a||{},{lines:12,length:7,width:5,radius:10,color:"#000",speed:1,trail:100,opacity:.25,fps:20})},p=o.prototype={spin:function(a){this.stop();var b=this,c=b.el=l(g(),{position:"relative"}),d,e;a&&(e=n(h(a,c,a.firstChild)),d=n(c),l(c,{left:(a.offsetWidth>>1)-d.x+e.x+"px",top:(a.offsetHeight>>1)-d.y+e.y+"px"})),c.setAttribute("aria-role","progressbar"),b.lines(c,b.opts);if(!f){var i=b.opts,j=0,k=i.fps,m=k/i.speed,o=(1-i.opacity)/(m*i.trail/100),p=m/i.lines;(function q(){j++;for(var a=i.lines;a;a--){var d=Math.max(1-(j+a*p)%m*o,i.opacity);b.opacity(c,i.lines-a,d,i)}b.timeout=b.el&&setTimeout(q,~~(1e3/k))})()}return b},stop:function(){var a=this.el;a&&(clearTimeout(this.timeout),a.parentNode&&a.parentNode.removeChild(a),this.el=c);return this}};p.lines=function(a,b){function e(a,d){return l(g(),{position:"absolute",width:b.length+b.width+"px",height:b.width+"px",background:a,boxShadow:d,transformOrigin:"left",transform:"rotate("+~~(360/b.lines*c)+"deg) translate("+b.radius+"px"+",0)",borderRadius:(b.width>>1)+"px"})}var c=0,d;for(;c<b.lines;c++)d=l(g(),{position:"absolute",top:1+~(b.width/2)+"px",transform:"translate3d(0,0,0)",opacity:b.opacity,animation:f&&j(b.opacity,b.trail,c,b.lines)+" "+1/b.speed+"s linear infinite"}),b.shadow&&h(d,l(e("#000","0 0 4px #000"),{top:"2px"})),h(a,h(d,e(b.color,"0 0 1px rgba(0,0,0,.1)")));return a},p.opacity=function(a,b,c){b<a.childNodes.length&&(a.childNodes[b].style.opacity=c)},function(){var a=l(g("group"),{behavior:"url(#default#VML)"}),b;if(!k(a,"transform")&&a.adj){for(b=4;b--;)i.addRule(["group","roundrect","fill","stroke"][b],"behavior:url(#default#VML)");p.lines=function(a,b){function k(a,d,i){h(f,h(l(e(),{rotation:360/b.lines*a+"deg",left:~~d}),h(l(g("roundrect",{arcsize:1}),{width:c,height:b.width,left:b.radius,top:-b.width>>1,filter:i}),g("fill",{color:b.color,opacity:b.opacity}),g("stroke",{opacity:0}))))}function e(){return l(g("group",{coordsize:d+" "+d,coordorigin:-c+" "+ -c}),{width:d,height:d})}var c=b.length+b.width,d=2*c,f=e(),i=~(b.length+b.radius+b.width)+"px",j;if(b.shadow)for(j=1;j<=b.lines;j++)k(j,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(j=1;j<=b.lines;j++)k(j);return h(l(a,{margin:i+" 0 0 "+i,zoom:1}),f)},p.opacity=function(a,b,c,d){var e=a.firstChild;d=d.shadow&&d.lines||0,e&&b+d<e.childNodes.length&&(e=e.childNodes[b+d],e=e&&e.firstChild,e=e&&e.firstChild,e&&(e.opacity=c))}}else f=k(a,"animation")}(),a.Spinner=o})(window,document);

(function($) {
	$.fn.spin = function(opts, color) {
		var presets = {
			"tiny": { lines: 8, length: 2, width: 2, radius: 3 },
			"small": { lines: 8, length: 4, width: 3, radius: 5 },
			"large": { lines: 10, length: 8, width: 4, radius: 8 }
		};
		if (Spinner) {
			return this.each(function() {
				var $this = $(this),
					data = this;

				if (data.spinner) {
					data.spinner.stop();
					delete data.spinner;
				}
				if (opts !== false) {
					if (typeof opts === "string") {
						if (opts in presets) {
							opts = presets[opts];
						} else {
							opts = {};
						}
						if (color) {
							opts.color = color;
						}
					}
					data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin();

					this.appendChild(data.spinner.el);
				}
			});
		} else {
			throw "Spinner class not available.";
		}
	};
})(window.jQuery || window.Zepto || window.ender);
// File: ./src/chromus.js
(function() {
  var Chromus, global;

  global = this;

  Chromus = (function() {

    Chromus.prototype.baseURL = "http://chromusapp-v2.appspot.com";

    Chromus.prototype.audio_players = {};

    Chromus.prototype.audio_sources = {};

    Chromus.prototype.media_types = {};

    Chromus.prototype.plugins = {};

    Chromus.prototype.plugins_info = {};

    Chromus.prototype.plugins_list = ['iframe_player', 'music_manager', 'ui', 'echonest', 'lastfm', 'loved_tracks_radio', 'vkontakte', 'about'];

    function Chromus() {
      _.bindAll(this);
      this.loadPlugins();
    }

    Chromus.prototype.injectPluginFiles = function() {
      var files, meta, plugin, _i, _len, _ref;
      files = [];
      _ref = this.plugins_list;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        plugin = _ref[_i];
        meta = this.plugins_info[plugin];
        files.push(_.map(meta['files'], function(file) {
          var match;
          match = file.match(/(.*!)?(.*)/);
          return "" + (match[1] || '') + meta.path + "/" + match[2] + "?" + (+new Date());
        }));
      }
      return yepnope({
        load: _.flatten(files),
        complete: this.pluginsLoadedCallback
      });
    };

    Chromus.prototype.loadPlugins = function() {
      var callback, plugin, _i, _len, _ref, _results;
      var _this = this;
      callback = _.after(this.plugins_list.length, this.injectPluginFiles);
      _ref = this.plugins_list;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        plugin = _ref[_i];
        _results.push((function(plugin) {
          var package_path, plugin_path;
          plugin_path = browser.extension.getURL("/plugins/" + plugin);
          package_path = "" + plugin_path + "/package.json?" + (+new Date());
          if (global.debug || (typeof exports !== "undefined" && exports !== null)) {
            return $.getJSON(package_path, function(package) {
              _this.plugins_info[plugin] = package;
              _this.plugins_info[plugin].path = plugin_path;
              return callback();
            });
          } else {
            _this.plugins_info[plugin] = {};
            return _this.plugins_info[plugin].path = plugin_path;
          }
        })(plugin));
      }
      return _results;
    };

    Chromus.prototype.pluginsLoadedCallback = function() {
      if (typeof global.isTestMode === "function" ? global.isTestMode() : void 0) {
        jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
        return jasmine.getEnv().execute();
      }
    };

    Chromus.prototype.registerPlugin = function(name, context) {
      return this.plugins[name] = context;
    };

    Chromus.prototype.registerPlayer = function(name, context) {
      return this.audio_players[name] = context;
    };

    Chromus.prototype.registerAudioSource = function(name, context) {
      return this.audio_sources[name] = context;
    };

    Chromus.prototype.registerMediaType = function(name, context) {
      return this.media_types[name] = context;
    };

    Chromus.prototype.addMenu = function(el) {
      return $('#main_menu').append(el);
    };

    Chromus.prototype.openPanel = function(content) {
      var panel;
      panel = $('<div class="panel">').html(content).appendTo($("#wrapper")).delegate('.back', 'click', function() {
        panel.removeClass('show');
        return _.delay(function() {
          return panel.remove();
        }, 300);
      });
      _.defer(function() {
        return panel.addClass('show');
      });
      return panel;
    };

    Chromus.prototype.closePanel = function() {
      var latest_panel;
      latest_panel = _.last($('.panel'));
      return $(latest_panel).find('.back').trigger('click');
    };

    return Chromus;

  })();

  this.chromus = new Chromus();

  this.chromus.utils = {
    uid: function() {
      var _ref;
      if ((_ref = this.uid_start) == null) this.uid_start = +new Date();
      return this.uid_start++;
    }
  };

}).call(this);

// File: ./src/utils.js
function findParent(element, className){
    if (!element)
      return false;

    if(element.className && element.className.match(className))
        return element
    else
        return findParent(element.parentNode, className)
}

function findElementPosition(element){
    var curleft = 0;
    var curtop = 0;

    if (element.offsetParent) {
        while (element.offsetParent) {
            curleft += element.offsetLeft - element.scrollLeft;
            curtop += element.offsetTop - element.scrollTop;

            var position='';

            if (element.style && element.style.position)
              position = element.style.position.toLowerCase();

            if (!position)
               if (element.currentStyle && element.currentStyle.position)
                   position = element.currentStyle.position.toLowerCase();

            if ((position=='absolute')||(position=='relative')) break;

            while (element.parentNode != element.offsetParent) {   
                element = element.parentNode;
                curleft -= element.scrollLeft;
                curtop -= element.scrollTop;
            }

            element = element.offsetParent;
        }
    } else {
        if (obj.x)
            curleft += obj.x;
        if (obj.y)
            curtop += obj.y;
    }
    
    return {left:curleft,top:curtop};
}

function xhrRequest(url, method, data, callback){
    var xhr = new XMLHttpRequest()

    //console.debug('Sending request:', url+'?'+data)

    if(method == "POST"){
        xhr.open(method, url, true)
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
        xhr.send(data)
    } else {
        if(url.match(/\?/))
            xhr.open(method, url+'&'+data, true)
        else
            xhr.open(method, url+'?'+data, true)

        xhr.send()
    }

    xhr.onreadystatechange = function(){
        if(xhr.readyState == 4){
            console.log("Response on "+url+" :", xhr, data)
//            console.log("Response text:", xhr.responseText)
            callback(xhr)
        }
    }
}

function xhrRedirectUrl(url, callback){    
    console.log("ASDASDASD")

    var xhr = new XMLHttpRequest()
    xhr.open("GET", url, true)
    xhr.send()
    
    console.log("Sending redirect response:", url)

    xhr.onreadystatechange = function(){
        console.log("Redirect response:", xhr)
    }
}

function prettyTime(seconds){
    seconds = parseInt(seconds)

    var minutes = parseInt(seconds/60)

    var seconds = seconds % 60
    if(seconds < 10)
        seconds = "0"+seconds

    if(minutes < 10)
        minutes = " "+minutes

    return minutes + ":" + seconds
}

function timeToSeconds(time){
    time = time.split(':')

    return parseInt(time[0])*60 + parseInt(time[1])
}

String.prototype.replaceEntities = function(){
   return this.replace(/&amp;/g, '&').replace(/%27/g,"'") 
}

String.prototype.stripHTML = function(){
   var tmp = document.createElement("DIV");
   tmp.innerHTML = this;
   return tmp.textContent||tmp.innerText;
}

Function.prototype.bind = function(scope) {
  var _function = this;
  
  return function() {
    return _function.apply(scope, arguments);
  }
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

Array.prototype.random = function() {
    return this[Math.floor(Math.random()*this.length)];
}

function getTrackInfo(button){
    if (button.getAttribute('data-media-type') == 'raw-file'){
        return {
            file_url: button.getAttribute('data-url'),
            source_url: document.location.href,      
            source_host: document.location.host,      
            song: button.innerHTML.stripHTML().trim() || "Loading track info...",
            element_id: button.id,
            index: 0
        }
    }

    var container = findParent(button, "ex_container");
    var streamable = false;

    if (container.className && container.className.match('fdl'))
        streamable = 'free';
    else if (container.className && container.className.match('streamable'))
        streamable = true;

    if (!window.pageID) {
        window.pageID = new Date().getTime();
    }

    var track_info = {
        artist:     container.getAttribute('data-artist'),
        song:       container.getAttribute('data-song'),
        album:      container.getAttribute('data-album'),
        track_id:   container.getAttribute('data-track-id'),
        index:      parseInt(container.getAttribute('data-index-number')),
        page_id:    window.pageID,
        source_url: document.location.href,      
        source_host: document.location.host,      
      
        element_id: button.id,
        streamable: streamable
    };

    if (!track_info.song) {
        if (!track_info.album) {
            track_info.type = "artist"
        } else {
            track_info.type = "album"
        }
    } else {
        track_info.type = "track"
    }


    for (var i; i < track_info.length; i++)
        if (track_info[i] == undefined) 
            delete track_info[i];
  
    return track_info
}


// Exporting functions for injected scripts in opera
window.getTrackInfo = getTrackInfo;
window.findParent = findParent;
// File: ./plugins/ui/ui_popup.js
(function() {
  var App, Controls, Footer, Player, Playlist, PlaylistView, Track, TrackInfo, clear_playlist;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Handlebars.registerHelper('lfm_img', function(context) {
    var image, _ref;
    if ((_ref = context.images) == null) context.images = context.image;
    if (!context.images) return "about:blank";
    image = context.images[0];
    if (typeof context.images[0] !== "string") {
      try {
        return context.images[1]["#text"];
      } catch (error) {

      }
    } else {
      return context.images[0];
    }
  });

  Track = (function() {

    __extends(Track, Backbone.Model);

    function Track() {
      Track.__super__.constructor.apply(this, arguments);
    }

    return Track;

  })();

  Playlist = (function() {

    __extends(Playlist, Backbone.Collection);

    function Playlist() {
      Playlist.__super__.constructor.apply(this, arguments);
    }

    Playlist.prototype.model = Track;

    return Playlist;

  })();

  Player = (function() {

    __extends(Player, Backbone.Model);

    function Player() {
      Player.__super__.constructor.apply(this, arguments);
    }

    Player.prototype.initialize = function() {
      _.bindAll(this, "listener");
      this.playlist = new Playlist();
      this.state = new Backbone.Model();
      this.settings = new Backbone.Model({
        repeat: false,
        shuffle: false
      });
      return browser.addMessageListener(this.listener);
    };

    Player.prototype.currentTrack = function() {
      return this.playlist.get(this.get('current_track'));
    };

    Player.prototype.play = function(track_id) {
      var track;
      if (track_id == null) track_id = this.get('current_track');
      track = this.playlist.get(track_id);
      if (!track.get('action')) {
        this.set({
          'current_track': track_id
        });
        this.state.set({
          'name': 'playing'
        });
      } else {
        track.set({
          'song': "Loading..."
        });
      }
      return browser.postMessage({
        method: 'play',
        track: parseInt(track_id)
      });
    };

    Player.prototype.pause = function() {
      this.state.set({
        'name': 'paused'
      });
      return browser.postMessage({
        method: 'pause'
      });
    };

    Player.prototype.next = function() {
      return browser.postMessage({
        method: 'nextTrack'
      });
    };

    Player.prototype.setPosition = function(position) {
      this.state.set({
        'played': position
      });
      return browser.postMessage({
        method: 'setPosition',
        position: position
      });
    };

    Player.prototype.setVolume = function(volume) {
      this.set({
        'volume': volume
      });
      return browser.postMessage({
        method: 'setVolume',
        volume: volume
      });
    };

    Player.prototype.setSettings = function(data) {
      this.settings.set(data);
      return browser.postMessage({
        method: 'setSettings',
        data: data
      });
    };

    Player.prototype.listener = function(msg) {
      var _ref;
      if (msg.method.match("^sm2")) return;
      if (!msg.method.match('(playerState|updateState)')) {
        console.log("Popup received message", msg.method, msg);
      } else {
        if (msg.track && ((_ref = msg.state.name) === "playing" || _ref === "loading")) {
          this.playlist.get(msg.track.id).set(msg.track);
          this.set({
            'current_track': msg.track.id
          });
        }
      }
      if (msg.settings != null) this.settings.set(msg.settings);
      this.set({
        'volume': msg.volume != null ? msg.volume : void 0
      });
      if (msg.state != null) this.state.set(msg.state);
      if (msg.playlist) return this.playlist.reset(msg.playlist);
    };

    return Player;

  })();

  Controls = (function() {

    __extends(Controls, Backbone.View);

    function Controls() {
      Controls.__super__.constructor.apply(this, arguments);
    }

    Controls.prototype.el = $('#header');

    Controls.prototype.search_template = Handlebars.compile($('#search_result_tmpl').html());

    Controls.prototype.events = {
      "click .inner": "setPosition",
      "click .progress": "setPosition",
      "click .toggle": "togglePlaying",
      "click .next": "nextTrack",
      "click .search": "toggleSearch",
      "keyup .search_bar .text": "search"
    };

    Controls.prototype.initialize = function() {
      var opts;
      var _this = this;
      _.bindAll(this);
      this.model.state.bind('change', this.updateState);
      opts = {
        lines: 8,
        length: 2,
        width: 2,
        radius: 3,
        color: "#fff"
      };
      this.spinner = new Spinner(opts);
      this.updateState(this.model.state);
      $('.panel.search span.add_to_playlist').live('click', function(evt) {
        return _this.addToPlaylist(evt);
      });
      return $('.panel.search a.ex_container').live('click', function(evt) {
        return _this.playSearchedTrack(evt);
      });
    };

    Controls.prototype.updateState = function(state) {
      var toggle, track, _ref;
      track = this.model.currentTrack();
      state = state.toJSON();
      toggle = this.$('.toggle').removeClass('play pause');
      this.spinner.stop();
      switch (state.name) {
        case "playing":
        case "stopped":
          toggle.addClass('play');
          break;
        case "paused":
          toggle.addClass('pause');
          break;
        case "loading":
          this.spinner.spin(toggle[0]);
          break;
        default:
          toggle.addClass('play');
      }
      if (track != null ? track.get('duration') : void 0) {
        this.$('.inner').width(state.played / track.get('duration') * 100 + '%');
        this.$('.time').html("-" + prettyTime(track.get('duration') - state.played));
        if ((_ref = state.buffered) == null) state.buffered = 0;
        return this.$('.progress').width(state.buffered / track.get('duration') * 100 + '%');
      } else {
        return this.$('.time').html(prettyTime(0));
      }
    };

    Controls.prototype.setPosition = function(evt) {
      var position, track;
      track = this.model.currentTrack();
      position = (evt.offsetX / 278) * track.get('duration');
      return this.model.setPosition(position);
    };

    Controls.prototype.togglePlaying = function() {
      if (this.model.state.get('name') === "paused") {
        return this.model.play();
      } else {
        return this.model.pause();
      }
    };

    Controls.prototype.nextTrack = function() {
      return this.model.next();
    };

    Controls.prototype.toggleSearch = function() {
      var _ref;
      var _this = this;
      $('#first_run .search-tip').hide();
      this.el.toggleClass('search_mode');
      if (this.el.hasClass('search_mode')) {
        this.$('.search_bar').addClass('show');
        setTimeout(function() {
          return _this.$('.search_bar').find('input').focus();
        }, 500);
        return this.search_panel = chromus.openPanel(this.search_template((_ref = this.search_view) != null ? _ref : {})).addClass('search');
      } else {
        this.$('.search_bar').removeClass('show');
        return chromus.closePanel();
      }
    };

    Controls.prototype.search = _.debounce(function(evt) {
      var render, text, _ref;
      var _this = this;
      if ((_ref = evt.keyCode) === 40 || _ref === 45 || _ref === 37 || _ref === 39 || _ref === 38) {
        return;
      }
      text = evt.currentTarget.value;
      if (!text.trim()) {
        return this.$('.search_bar .result').html('');
      } else {
        $('#first_run .search-tip').hide();
        this.search_view = {
          'search_term': text,
          'show_tracks': function(fn) {
            var _ref2;
            if (!this.tracks || ((_ref2 = this.tracks) != null ? _ref2.length : void 0)) {
              return fn(this);
            }
          },
          'show_albums': function(fn) {
            var _ref2;
            if (!this.albums || ((_ref2 = this.albums) != null ? _ref2.length : void 0)) {
              return fn(this);
            }
          },
          'show_artists': function(fn) {
            var _ref2;
            if (!this.artists || ((_ref2 = this.artists) != null ? _ref2.length : void 0)) {
              return fn(this);
            }
          }
        };
        render = function() {
          var _ref2;
          return _this.search_panel.html(_this.search_template((_ref2 = _this.search_view) != null ? _ref2 : {})).find('.loader').spin('small');
        };
        render();
        chromus.plugins.lastfm.artist.search(text, function(artists) {
          if (artists == null) artists = [];
          _this.search_view.artists = _.first(artists, 4);
          return render();
        });
        chromus.plugins.lastfm.track.search(text, function(tracks) {
          if (tracks == null) tracks = [];
          _this.search_view.tracks = _.first(tracks, 4);
          return render();
        });
        return chromus.plugins.lastfm.album.search(text, function(albums) {
          if (albums == null) albums = [];
          _this.search_view.albums = _.first(albums, 4);
          return render();
        });
      }
    }, 500);

    Controls.prototype.playSearchedTrack = function(evt) {
      var track_info;
      track_info = getTrackInfo(evt.currentTarget);
      browser.postMessage({
        method: 'play',
        track: track_info,
        playlist: [track_info]
      });
      return this.toggleSearch();
    };

    Controls.prototype.addToPlaylist = function(evt) {
      var track_info;
      track_info = getTrackInfo(evt.currentTarget.parentNode);
      browser.postMessage({
        method: 'addToPlaylist',
        tracks: [track_info]
      });
      this.toggleSearch();
      return evt.stopPropagation();
    };

    return Controls;

  })();

  TrackInfo = (function() {

    __extends(TrackInfo, Backbone.View);

    function TrackInfo() {
      TrackInfo.__super__.constructor.apply(this, arguments);
    }

    TrackInfo.prototype.el = $('#current_song');

    TrackInfo.prototype.events = {
      "click .album_img": "albumCover"
    };

    TrackInfo.prototype.template = Handlebars.compile($('#track_info_tmpl').html());

    TrackInfo.prototype.initialize = function() {
      _.bindAll(this, "updateInfo");
      this.model.bind('change:current_track', this.updateInfo);
      return this.model.playlist.bind('all', _.debounce(this.updateInfo, 500));
    };

    TrackInfo.prototype.updateInfo = function() {
      var last_fm, track, _ref, _ref2;
      track = (_ref = this.model.currentTrack()) != null ? _ref.toJSON() : void 0;
      if (!track) return this.el.empty();
      if ((_ref2 = track.images) == null) {
        track.images = [
          chromus.plugins.lastfm.image({
            artist: track.artist
          })
        ];
      }
      last_fm = "http://last.fm/music";
      track.artist_url = "" + last_fm + "/" + track.artist;
      track.album_url = "" + last_fm + "/" + track.artist + "/" + track.album;
      track.song_url = "" + last_fm + "/" + track.artist + "/_/" + track.song;
      return this.el.html(this.template(track)).show();
    };

    TrackInfo.prototype.albumCover = function() {
      var img, src, track;
      return false;
      track = this.model.currentTrack();
      if (track.get('images').length) {
        img = new Image();
        src = _.last(track.get('images'));
        if (typeof src !== "string") src = src['#text'];
        img.src = src;
        img.onclick = function() {
          return $('#dialog').hide();
        };
        $('#dialog .content').html(img);
        return $('#dialog').show();
      }
    };

    return TrackInfo;

  })();

  Footer = (function() {

    __extends(Footer, Backbone.View);

    function Footer() {
      Footer.__super__.constructor.apply(this, arguments);
    }

    Footer.prototype.el = $('#footer');

    Footer.prototype.events = {
      "click .menu": "toggleMenu",
      "click .volume": "toggleVolume",
      "click .volume_bar .bar_bg": "setVolume",
      "click .shuffle": "toggleShuffle",
      "click .repeat": "toggleRepeat"
    };

    Footer.prototype.initialize = function() {
      _.bindAll(this);
      this.model.bind('change:volume', this.updateVolume);
      this.model.settings.bind('change', this.updateSettings);
      this.updateVolume();
      return $(document).bind('click', function(evt) {
        if ($('#main_menu').css('display') !== 'none' && !$(evt.target).hasClass('menu')) {
          if (!$(evt.target).closest('#main_menu').length) {
            return $('#main_menu').hide();
          }
        }
      });
    };

    Footer.prototype.toggleMenu = function() {
      $('#first_run .settings-tip').hide();
      return $('#main_menu').toggle();
    };

    Footer.prototype.toggleVolume = function() {
      return this.model.setVolume(0);
    };

    Footer.prototype.setVolume = function(evt) {
      var total_width, volume;
      total_width = this.$('.volume_bar .bar_bg').width();
      volume = evt.layerX / total_width * 100;
      return this.model.setVolume(volume);
    };

    Footer.prototype.updateVolume = function() {
      return this.$('.volume_bar .bar').css({
        width: this.model.get('volume') + "%"
      });
    };

    Footer.prototype.toggleShuffle = function() {
      return this.model.setSettings({
        'shuffle': !this.$('.shuffle').hasClass('active')
      });
    };

    Footer.prototype.toggleRepeat = function() {
      return this.model.setSettings({
        'repeat': !this.$('.repeat').hasClass('active')
      });
    };

    Footer.prototype.updateSettings = function() {
      this.$('.shuffle').toggleClass('active', this.model.settings.get('shuffle'));
      return this.$('.repeat').toggleClass('active', this.model.settings.get('repeat'));
    };

    return Footer;

  })();

  PlaylistView = (function() {

    __extends(PlaylistView, Backbone.View);

    function PlaylistView() {
      PlaylistView.__super__.constructor.apply(this, arguments);
    }

    PlaylistView.prototype.el = $('#playlist');

    PlaylistView.prototype.template = Handlebars.compile($('#playlist_tmpl').html());

    PlaylistView.prototype.events = {
      "click #playlist .song": "togglePlaying"
    };

    PlaylistView.prototype.initialize = function() {
      var evt, render_limiter, _i, _len, _ref;
      _.bindAll(this, 'updatePlaylist', 'updateCurrent');
      render_limiter = _.debounce(this.updatePlaylist, 200);
      _ref = ['change:song', 'change:artist', 'add', 'remove', 'reset'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        evt = _ref[_i];
        this.model.playlist.bind(evt, render_limiter);
      }
      this.model.bind("change:current_track", this.updateCurrent);
      return this.el.find('.nano').nanoScroller();
    };

    PlaylistView.prototype.togglePlaying = function(evt) {
      var id;
      id = +$(evt.currentTarget).attr('data-id');
      if (this.model.get('current_track') === id) {
        return this.model.pause();
      } else {
        return this.model.play(id);
      }
    };

    PlaylistView.prototype.artistPlaylistCount = function(artist, start_from) {
      var count, track, _i, _len, _ref;
      count = 0;
      _ref = this.model.playlist.models.slice(start_from, (start_from + 3) + 1 || 9e9);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        track = _ref[_i];
        if (track.get('artist') === artist) count++;
      }
      return count;
    };

    PlaylistView.prototype.updateCurrent = function() {
      var current;
      this.$('.song.playing').removeClass('playing');
      current = this.model.get('current_track');
      if (current) {
        return this.$(".track_container.id" + current + " .song").addClass('playing');
      }
    };

    PlaylistView.prototype.updatePlaylist = function() {
      var helpers, merge_rows, model, playlist, track, view, _i, _len, _ref;
      merge_rows = 0;
      playlist = this.model.playlist.toJSON();
      for (_i = 0, _len = playlist.length; _i < _len; _i++) {
        track = playlist[_i];
        if ((_ref = track.images) == null) {
          track.images = [
            chromus.plugins.lastfm.image({
              artist: track.artist
            })
          ];
        }
        track.previous = playlist[_i - 1];
        track.next = playlist[_i + 1];
        if (!track.previous || track.previous.artist !== track.artist) {
          track.artist_playlist_count = this.artistPlaylistCount(track.artist, _i);
        }
      }
      view = {
        playlist: playlist
      };
      model = this.model;
      helpers = {
        is_previous: function(fn) {
          if (!this.previous || this.previous.artist !== this.artist) {
            return fn(this);
          }
        },
        is_next: function(fn) {
          if (!this.next || this.next.artist !== this.artist) return fn(this);
        },
        title: function(fn) {
          if (this.type === 'artist') {
            return "Loading...";
          } else {
            return this.song || this.name;
          }
        },
        more_then_two: function(fn) {
          if (this.artist_playlist_count > 2) return fn(this);
        },
        is_current: function(fn) {
          if (this.id === model.get('current_track')) return fn(this);
        }
      };
      helpers = _.defaults(helpers, Handlebars.helpers);
      this.el.find('.container').html(this.template(view, {
        helpers: helpers
      }));
      this.el.css({
        visibility: 'visible'
      });
      this.el.find('.track_container').each(function(idx, el) {
        if (idx % 2 === 0) return $(el).addClass('odd');
      });
      return this.el.find('.nano').nanoScroller();
    };

    return PlaylistView;

  })();

  App = (function() {

    __extends(App, Backbone.View);

    function App() {
      App.__super__.constructor.apply(this, arguments);
    }

    App.prototype.initialize = function() {
      this.model = new Player();
      this.playlist = new PlaylistView({
        model: this.model
      });
      this.controls = new Controls({
        model: this.model
      });
      this.track_info = new TrackInfo({
        model: this.model
      });
      this.footer = new Footer({
        model: this.model
      });
      $('#dialog').bind('click', function(evt) {
        if (evt.target.id === "dialog") return $('#dialog').hide();
      });
      if (browser.isPokki) {
        $('#minimize').bind('click', function() {
          return pokki.closePopup();
        });
      }
      if (!store.get('first_run')) {
        $('#first_run').show();
        $('#first_run > div').bind('click', function(evt) {
          return $(evt.currentTarget).remove();
        });
        store.set('first_run', true);
      }
      return $('.panel .back').live('click', function(evt) {
        return $('#header').removeClass('search_mode').find('.search_bar').removeClass('show');
      });
    };

    App.prototype.start = function() {
      return browser.postMessage({
        method: 'ui:init'
      });
    };

    return App;

  })();

  this.app = new App();

  $(function() {
    return browser.onReady(function() {
      return app.start();
    });
  });

  clear_playlist = $('<li>Clear playlist</li>').bind('click', function() {
    $('#main_menu').hide();
    return browser.postMessage({
      method: "clearPlaylist"
    });
  });

  chromus.addMenu(clear_playlist);

}).call(this);

// File: ./plugins/echonest/echonest.js
(function() {
  var Echo, _ref;

  Echo = {
    settings: {
      baseURL: "http://developer.echonest.com/api/v4",
      format: "jsonp",
      api_key: "D3QELXPGA1KC6AJ6U"
    },
    callMethod: function(method, data, callback) {
      if (data == null) data = {};
      data.format = this.settings.format;
      data.api_key = this.settings.api_key;
      return $.ajax({
        url: "" + this.settings.baseURL + "/" + method,
        data: data,
        cache: true,
        dataType: this.settings.format,
        success: function(resp) {
          console.log("Echo response:", resp);
          return callback(resp.response);
        }
      });
    },
    song: {
      search: function(string, callback) {
        return Echo.callMethod("song/search", {
          combined: string,
          sort: "artist_familiarity-desc"
        }, function(resp) {
          return callback(resp.songs);
        });
      }
    },
    artist: {
      suggest: function(string, callback) {
        return Echo.callMethod("artist/suggest", {
          name: string
        }, function(resp) {
          return callback(resp.artists);
        });
      }
    }
  };

  if ((_ref = this.chromus) != null) _ref.registerPlugin("echo", Echo);

}).call(this);

// File: ./plugins/lastfm/md5.js
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Copyright (C) Paul Johnston 1999 - 2000.
 * Updated by Greg Holt 2000 - 2001.
 * See http://pajhome.org.uk/site/legal.html for details.
 */

/*
 * Convert a 32-bit number to a hex string with ls-byte first
 */
(function(global){
var hex_chr = "0123456789abcdef";
function rhex(num)
{
  str = "";
  for(j = 0; j <= 3; j++)
    str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
           hex_chr.charAt((num >> (j * 8)) & 0x0F);
  return str;
}

/*
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the MD5 standard.
 */
function str2blks_MD5(str)
{
  nblk = ((str.length + 8) >> 6) + 1;
  blks = new Array(nblk * 16);
  for(i = 0; i < nblk * 16; i++) blks[i] = 0;
  for(i = 0; i < str.length; i++)
    blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally 
 * to work around bugs in some JS interpreters.
 */
function add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the basic operation for each round of the
 * algorithm.
 */
function cmn(q, a, b, x, s, t)
{
  return add(rol(add(add(a, q), add(x, t)), s), b);
}
function ff(a, b, c, d, x, s, t)
{
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t)
{
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t)
{
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t)
{
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Take a string and return the hex representation of its MD5.
 */
function calcMD5(str)
{
  x = str2blks_MD5(str);
  a =  1732584193;
  b = -271733879;
  c = -1732584194;
  d =  271733878;

  for(i = 0; i < x.length; i += 16)
  {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;

    a = ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i+10], 17, -42063);
    b = ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = ff(d, a, b, c, x[i+13], 12, -40341101);
    c = ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = ff(b, c, d, a, x[i+15], 22,  1236535329);    

    a = gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = gg(c, d, a, b, x[i+11], 14,  643717713);
    b = gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = gg(c, d, a, b, x[i+15], 14, -660478335);
    b = gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = gg(b, c, d, a, x[i+12], 20, -1926607734);
    
    a = hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = hh(b, c, d, a, x[i+14], 23, -35309556);
    a = hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = hh(d, a, b, c, x[i+12], 11, -421815835);
    c = hh(c, d, a, b, x[i+15], 16,  530742520);
    b = hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i+10], 15, -1051523);
    b = ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = ii(d, a, b, c, x[i+15], 10, -30611744);
    c = ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = add(a, olda);
    b = add(b, oldb);
    c = add(c, oldc);
    d = add(d, oldd);
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}

global.MD5 = calcMD5
})(this);
// File: ./plugins/lastfm/lastfm.js
(function() {
  var LastFM, hashToQueryString;
  var __hasProp = Object.prototype.hasOwnProperty;

  hashToQueryString = function(hash) {
    var key, params, value;
    params = [];
    for (key in hash) {
      if (!__hasProp.call(hash, key)) continue;
      value = hash[key];
      params.push("" + key + "=" + value);
    }
    return params.join('&');
  };

  LastFM = {
    settings: {
      baseURL: "http://ws.audioscrobbler.com/2.0/",
      format: "json",
      api_key: "48e602d0f8c4d34f00b1b17d96ab88c1",
      api_secret: "c129f28ec70abc4311b21fa8473d34e7"
    },
    getSignature: function(data) {
      var key, signature, value;
      signature = [];
      for (key in data) {
        if (!__hasProp.call(data, key)) continue;
        value = data[key];
        if (key !== 'format') signature.push(key + value);
      }
      signature.sort();
      return MD5(signature.join('') + LastFM.settings.api_secret);
    },
    getSession: function() {
      if (browser.isPokki) {
        return pokki.descramble(store.get('lastfm:key'));
      } else {
        return store.get('lastfm:key');
      }
    },
    callMethod: function(method, data, callback) {
      if (data == null) data = {};
      data.format = this.settings.format;
      data.api_key = this.settings.api_key;
      data.method = method;
      if (data.sig_call) {
        delete data.sig_call;
        if (!method.match(/^auth/)) data.sk = LastFM.getSession();
        data.api_sig = this.getSignature(data);
      }
      return $.ajax({
        url: "" + this.settings.baseURL,
        data: data,
        cache: true,
        dataType: this.settings.format,
        success: function(resp) {
          console.log("Lastfm response:", resp);
          return callback(resp);
        },
        error: function(resp) {
          return callback({
            error: "asd"
          });
        }
      });
    },
    convertDateToUTC: function(date) {
      if (date == null) date = new Date();
      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    },
    fakePostRequest: function(url, data) {
      var form, iframe, input, key, value;
      iframe = document.createElement('iframe');
      iframe.name = iframe.id = +new Date();
      document.body.appendChild(iframe);
      form = document.createElement('form');
      form.action = url;
      form.method = "post";
      form.target = iframe.id;
      for (key in data) {
        if (!__hasProp.call(data, key)) continue;
        value = data[key];
        input = document.createElement('input');
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      return setTimeout(function() {
        document.body.removeChild(iframe);
        return document.body.removeChild(form);
      }, 2000);
    },
    track: {
      scrobble: function(data, callback) {
        var signature;
        data.method = 'track.scrobble';
        data.timestamp = ((+new Date()) / 1000) | 0;
        data.sk = LastFM.getSession();
        data.api_key = LastFM.settings.api_key;
        signature = LastFM.getSignature(data);
        data.api_sig = signature;
        return LastFM.fakePostRequest("" + LastFM.settings.baseURL, data);
      },
      updateNowPlaying: function(data, callback) {
        var signature;
        data.method = 'track.updateNowPlaying';
        data.sk = LastFM.getSession();
        data.api_key = LastFM.settings.api_key;
        signature = LastFM.getSignature(data);
        data.api_sig = signature;
        return LastFM.fakePostRequest("" + LastFM.settings.baseURL, data);
      },
      search: function(string, callback) {
        return LastFM.callMethod("track.search", {
          track: string
        }, function(resp) {
          var _ref;
          return callback((_ref = resp.results.trackmatches) != null ? _ref.track : void 0);
        });
      }
    },
    artist: {
      search: function(string, callback) {
        return LastFM.callMethod("artist.search", {
          artist: string
        }, function(resp) {
          var _ref;
          return callback((_ref = resp.results.artistmatches) != null ? _ref.artist : void 0);
        });
      },
      getTopTracks: function(artist, callback) {
        return LastFM.callMethod("artist.getTopTracks", {
          "artist": artist
        }, function(resp) {
          var tracks;
          tracks = resp.toptracks.track;
          tracks = _.map(tracks, function(track) {
            return {
              artist: track.artist.name,
              song: track.name,
              duration: parseInt(track.duration),
              images: track.image
            };
          });
          return callback(tracks);
        });
      }
    },
    album: {
      search: function(album, callback) {
        return LastFM.callMethod("album.search", {
          "album": album
        }, function(resp) {
          var _ref;
          return callback((_ref = resp.results.albummatches) != null ? _ref.album : void 0);
        });
      },
      getInfo: function(artist, album, callback) {
        return LastFM.callMethod("album.getInfo", {
          "album": album,
          "artist": artist
        }, function(resp) {
          var tracks;
          tracks = resp.album.tracks.track;
          tracks = _.map(tracks, function(track) {
            return {
              artist: track.artist.name,
              song: track.name,
              duration: parseInt(track.duration),
              images: track.images
            };
          });
          return callback(tracks);
        });
      }
    },
    image: function(options) {
      var method_prefix, params, _ref;
      if (!options.artist) return;
      if ((_ref = options.size) == null) options.size = "mediumsquare";
      params = [];
      if (options.album) {
        method_prefix = "album";
        params.push("album=" + encodeURIComponent(options.album));
      } else {
        method_prefix = "artist";
        params.push("artist=" + encodeURIComponent(options.artist));
      }
      return "" + LastFM.settings.baseURL + "?api_key=" + LastFM.settings.api_key + "&method=" + method_prefix + ".getImageRedirect&size=" + options.size + "&" + (params.join('&'));
    },
    radio: {
      getPlaylist: function(callback) {
        return LastFM.callMethod("radio.getPlaylist", {
          sig_call: true
        }, function(resp) {
          var tracks;
          tracks = resp.playlist.trackList.track;
          tracks = _.map(tracks, function(track) {
            return {
              artist: track.creator,
              song: track.title,
              file_url: track.location,
              images: [track.image],
              duration: track.duration / 1000,
              lastfm_radio: true,
              type: 'lastfm:stream_track',
              source_title: resp.playlist.title,
              source_icon: "http://cdn.last.fm/flatness/favicon.2.ico"
            };
          });
          tracks.push({
            song: "Load next tracks",
            artist: "",
            type: "lastfm:radio_loader",
            action: true
          });
          return callback(tracks);
        });
      },
      tune: function(station, callback) {
        var data, signature;
        if (station.match(/loved$/)) {
          LastFM._station = 'loved';
          return callback();
        }
        data = {
          station: station
        };
        data.method = 'radio.tune';
        data.sk = LastFM.getSession();
        data.api_key = LastFM.settings.api_key;
        signature = LastFM.getSignature(data);
        data.api_sig = signature;
        data.format = "json";
        data._url = "" + LastFM.settings.baseURL;
        data._method = "POST";
        return $.ajax({
          url: "" + chromus.baseURL + "/proxy?_callback=?",
          data: data,
          dataType: "jsonp",
          cache: true,
          success: function(resp) {
            resp = JSON.parse(resp.response);
            if (!resp.error) {
              return callback();
            } else {
              return browser.postMessage({
                method: "lastfm:error",
                error: resp.error.code
              });
            }
          }
        });
      }
    }
  };

  this.chromus.registerPlugin("lastfm", LastFM);

}).call(this);

// File: ./plugins/lastfm/lastfm_ui.js
(function() {
  var Menu, SettingsView, lastfm, menu, template;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  lastfm = chromus.plugins.lastfm;

  template = Handlebars.compile('    \
    <header>\
        <a class="back"></a>\
        <h3>Last.FM</h3>\
    </header>\
    {{#if logged}}\
        <form class="form">\
            <div class="logo"></div>\
            <ul>          \
                <li class="username">\
                    <label>Logged as <a href="http://last.fm/user/{{user}}" target="_blank">{{user}}</a></label>\
                </li>\
                <li class="toggle">\
                    <label>Scrobbling</label>\
                    <div class="toggler {{#unless scrobbling}}off{{/unless}}">\
                        <div></div>\
                    </div>                    \
                </li>\
                <li class="clearfix"></li>\
                \
                <li class="header">\
                    <span>Your Stations</span>\
                    {{#unless subscriber}}<span class="notice">Some stations available for subscribers only</span>{{/unless}}\
                </li>\
\
                <li class="stations {{#unless subscriber}}subscribe{{/unless}}">\
                    <ul>                    \
                        <li class="loved_radio free">Loved Tracks</li>\
\
                        <li class="lastfm_radio pay" data-radio="lastfm://user/{{user}}/personal">Library Radio</li>\
                        <li class="lastfm_radio pay" data-radio="lastfm://user/{{user}}/mix">Mix Radio</li>\
                        <li class="lastfm_radio pay" data-radio="lastfm://user/{{user}}/recommended">Recommended Radio</li>\
                        <li class="lastfm_radio pay" data-radio="lastfm://user/{{user}}/friends">Friends Radio</li>\
                        <li class="lastfm_radio pay" data-radio="lastfm://user/{{user}}/neighbours">Neighbourhood Radio</li>\
                    </ul>\
                </li>\
                <li class="clearfix"></li>\
                            \
                <li class="logout btn danger">Logout</li>\
            </ul>\
        </form>    \
    {{else}}\
    <form class="form login" onsubmit="return false">\
        <div class="logo"></div>\
        <ul>            \
            <li>\
                <label>Username <span class="error" style="display:none">Wrong credentials</span></label>\
                <input name="username" autofocus/>\
            </li>\
            <li>\
                <label>Password</label>\
                <input type="password" name="password" />\
            </li>\
            <li class="buttons">\
                <input type="submit" value="Login" class="btn" />\
            </li>\
        </ul>\
    </form>\
    {{/if}}\
    ');

  SettingsView = (function() {

    __extends(SettingsView, Backbone.View);

    function SettingsView() {
      SettingsView.__super__.constructor.apply(this, arguments);
    }

    SettingsView.prototype.className = "lastfm";

    SettingsView.prototype.events = {
      "submit form.login": "login",
      "click .logout": "logout",
      "click .toggler": "toggleScrobbling",
      "click .lastfm_radio": "playRadio",
      "click .loved_radio": "playLovedRadio"
    };

    SettingsView.prototype.initialize = function() {
      chromus.openPanel(this.el);
      return this.render();
    };

    SettingsView.prototype.render = function() {
      var view;
      view = {
        logged: !!lastfm.getSession(),
        scrobbling: !!store.get('lastfm:scrobbling'),
        user: store.get('lastfm:user'),
        subscriber: !!parseInt(store.get('lastfm:subscriber'))
      };
      this.el.innerHTML = template(view);
      return this.delegateEvents();
    };

    SettingsView.prototype.logout = function() {
      store.remove('lastfm:user');
      store.remove('lastfm:key');
      return this.render();
    };

    SettingsView.prototype.toggleScrobbling = function() {
      store.set('lastfm:scrobbling', !store.get('lastfm:scrobbling'));
      return this.$('.toggler').toggleClass('off', !store.get('lastfm:scrobbling'));
    };

    SettingsView.prototype.playRadio = function(evt) {
      var track;
      track = {
        type: "lastfm:radio",
        artist: "LastFM radio",
        song: "Loading...",
        station: $(evt.target).attr('data-radio')
      };
      browser.postMessage({
        method: "play",
        track: track,
        playlist: [track]
      });
      return chromus.closePanel();
    };

    SettingsView.prototype.playLovedRadio = function(evt) {
      var track;
      track = {
        type: "lastfm:loved",
        artist: "LastFM Loved radio (free)",
        song: "Loading..."
      };
      browser.postMessage({
        method: "play",
        track: track,
        playlist: [track]
      });
      return chromus.closePanel();
    };

    SettingsView.prototype.login = function(evt) {
      var auth_token, form, password, username, _ref;
      var _this = this;
      form = evt.target;
      _ref = [form.username.value, form.password.value], username = _ref[0], password = _ref[1];
      this.$('.login *').css({
        'visibility': 'hidden'
      });
      this.spinner = new Spinner().spin(this.el);
      auth_token = MD5(username + MD5(password));
      lastfm.callMethod('auth.getMobileSession', {
        sig_call: true,
        username: username,
        authToken: auth_token
      }, function(resp) {
        _this.$('.login *').css({
          'visibility': 'visible'
        });
        if (resp.error) {
          _this.$('.error').show();
          return _this.spinner.stop();
        } else if (resp.session) {
          store.set('lastfm:user', resp.session.name);
          store.set('lastfm:subscriber', parseInt(resp.session.subscriber));
          if (browser.isPokki) {
            store.set('lastfm:key', pokki.scramble(resp.session.key));
          } else {
            store.set('lastfm:key', resp.session.key);
          }
          store.set('lastfm:scrobbling', true);
          return _this.render();
        }
      });
      return evt.stopPropagation();
    };

    return SettingsView;

  })();

  Menu = (function() {

    __extends(Menu, Backbone.View);

    function Menu() {
      Menu.__super__.constructor.apply(this, arguments);
    }

    Menu.prototype.tagName = 'li';

    Menu.prototype.className = 'lastfm';

    Menu.prototype.events = {
      "click": "openPanel"
    };

    Menu.prototype.initialize = function() {
      this.container = $('#main_menu');
      return this.render();
    };

    Menu.prototype.render = function() {
      this.el.innerHTML = "Last.FM";
      return this.delegateEvents();
    };

    Menu.prototype.openPanel = function() {
      new SettingsView();
      return $('#main_menu').hide();
    };

    return Menu;

  })();

  menu = new Menu();

  chromus.addMenu(menu.el);

  browser.addMessageListener(function(msg) {
    switch (msg.method) {
      case "lastfm:error":
        return error_window.render();
    }
  });

}).call(this);

// File: ./plugins/vkontakte/vkontakte.js
(function() {
  var VK, global;

  global = this;

  VK = {
    APP_ID: global.debug ? "2649785" : "2698877",
    SCOPE: "audio,offline",
    authURL: function() {
      var baseLocation, link, plugin_path, redirect_uri;
      if (browser.isChrome) {
        baseLocation = "" + chromus.baseURL + "/chromus/index.html";
      } else {
        baseLocation = document.location.toString();
      }
      plugin_path = chromus.plugins_info.vkontakte.path;
      plugin_path = plugin_path.replace(/chrome-extension:\/\/\w+\//, "");
      redirect_uri = [baseLocation, "/../", plugin_path, "/oauth.html"].join('');
      return link = ["http://api.vkontakte.ru/oauth/authorize?", "client_id=" + VK.APP_ID, "scope=" + VK.SCOPE, "redirect_uri=" + redirect_uri, "display=popup", "response_type=token"].join('&');
    },
    searchWithoutLogin: function(args, callback) {
      return $.ajax({
        url: "" + chromus.baseURL + "/api/token/get",
        dataType: "jsonp",
        success: function(resp) {
          if (!resp.error) {
            args.access_token = resp.token;
            return VK.searchAPI(args, callback);
          }
        }
      });
    },
    searchAPI: function(args, callback) {
      var data, query;
      console.warn('searching as logged user');
      query = "" + args.artist + " " + args.song;
      data = {
        q: query,
        format: 'json',
        sort: 2,
        count: 10
      };
      if (!args.access_token) {
        if (browser.isPokki) {
          data.access_token = pokki.descrumble(store.get('vk:token'));
        } else {
          data.access_token = store.get('vk:token');
        }
      } else {
        data.access_token = args.access_token;
      }
      return $.ajax({
        url: "https://api.vkontakte.ru/method/audio.search",
        data: data,
        dataType: "jsonp",
        cache: true,
        success: function(result) {
          var records;
          if (!result.response) return callback([]);
          records = _.map(_.rest(result.response), function(i) {
            return {
              artist: i.artist,
              song: i.title,
              duration: parseInt(i.duration),
              file_url: i.url,
              source_title: "Vkontakte",
              source_icon: "http://vkontakte.ru/favicon.ico"
            };
          });
          return callback(records);
        }
      });
    },
    search: function(args, callback) {
      if (store.get('vk:user_id')) {
        return VK.searchAPI(args, callback);
      } else {
        return VK.searchWithoutLogin(args, callback);
      }
    }
  };

  this.chromus.registerPlugin("vkontakte", VK);

  this.chromus.registerAudioSource("vkontakte", VK);

  browser.addMessageListener(function(msg, sender, sendResponse) {
    switch (msg.method) {
      case "vk:auth":
        store.set("vk:token", msg.auth.access_token);
        store.set("vk:user_id", msg.auth.user_id);
        $.ajax({
          url: "" + chromus.baseURL + "/api/token/add",
          data: {
            token: msg.auth.access_token
          },
          dataType: "jsonp",
          success: function(resp) {
            return console.log('token added');
          }
        });
        return console.warn("logged!");
    }
  });

}).call(this);

// File: ./plugins/vkontakte/vkontakte_ui.js
(function() {
  var UI, menu, template, ui, vk;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  template = Handlebars.compile('    \
    <header>\
        <a class="back"></a>\
        <h3>Vkontakte</h3>\
    </header>\
    <form class="form">\
    	<div class="logo"></div>\
	{{#if logged}}        		\
    	<ul>\
    		<li>\
    			<h3 style="font-size:20px; font-weight: bold; margin-bottom: 10px;">Logged!</h3>\
    			<p style="font-size: 14px;">Rest of functionality will be available in next update. Stay tuned!</p>\
    		</li>\
    		<li>\
    			<a class="btn logout" style="color: red">Logout</a>\
    		</li>\
    	</ul>       	\
    {{else}}    \
    	<ul>\
    		<li style="text-align: center">\
    			<a class="btn login">Login to Vkontakte</a>\
    		</li>\
    	</ul>\
    {{/if}}\
    </form>\
');

  vk = chromus.plugins.vkontakte;

  UI = (function() {

    __extends(UI, Backbone.View);

    function UI() {
      UI.__super__.constructor.apply(this, arguments);
    }

    UI.prototype.className = 'vkontakte';

    UI.prototype.events = {
      "click .login": "login",
      "click .logout": "logout"
    };

    UI.prototype.initialize = function() {
      _.bindAll(this);
      this.render();
      return window.setVKSession = this.setSession;
    };

    UI.prototype.open = function() {
      return chromus.openPanel(this.el);
    };

    UI.prototype.render = function() {
      var view;
      view = {
        logged: !!store.get('vk:token')
      };
      $(this.el).html(template(view));
      return this.delegateEvents();
    };

    UI.prototype.setSession = function(session) {
      store.set("vk:token", session.access_token);
      store.set("vk:user_id", session.user_id);
      $.ajax({
        url: "" + chromus.baseURL + "/api/token/add",
        data: {
          token: session.access_token
        },
        dataType: "jsonp",
        success: function(resp) {
          return console.log('token added');
        }
      });
      return this.render();
    };

    UI.prototype.login = function() {
      return window.open(vk.authURL(), "Vkontakte", "status=0,toolbar=0,location=0,menubar=0,resizable=1");
    };

    UI.prototype.logout = function() {
      $.ajax({
        url: "" + chromus.baseURL + "/api/token/delete",
        data: {
          token: store.get("vk:token")
        },
        dataType: "jsonp",
        success: function(resp) {
          return console.log('token removed');
        }
      });
      store.remove("vk:token");
      store.remove("vk:user_id");
      return this.render();
    };

    return UI;

  })();

  ui = new UI();

  menu = $('<li class="vkontakte">Vkontakte</li>').bind('click', function() {
    $('#main_menu').hide();
    return ui.open();
  });

  chromus.addMenu(menu);

}).call(this);

// File: ./plugins/about/about.js
(function() {
  var About, about, template;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  template = Handlebars.compile('    \
    <header>\
        <a class="back"></a>\
        <h3>About</h3>\
    </header>\
    <div style="margin-top:20px; text-align:center">\
        <h1 style="background:url(assets/icons/42x42.png) center left no-repeat; font-weight: bold; font-size: 16px; display: inline-block; line-height: 42px; padding-left: 50px">Chromus v3.0.2</h1>\
\
        <a href="https://github.com/chromus/chromus" style="display:block;margin-top:15px; font-size: 14px;" target="_blank">github</a>\
\
        <div>\
            <label><input type="checkbox" name="debug" {{#if debug}}checked="checked"{{/if}}/> Debug mode</label>            \
        </div>\
    </div>\
');

  About = (function() {

    __extends(About, Backbone.View);

    function About() {
      About.__super__.constructor.apply(this, arguments);
    }

    About.prototype.events = {
      "change input[name='debug']": 'toggleDebug'
    };

    About.prototype.initialize = function() {
      chromus.openPanel(this.el);
      return this.render();
    };

    About.prototype.render = function() {
      var view;
      view = {
        debug: store.get('debug')
      };
      return this.el.innerHTML = template(view);
    };

    About.prototype.toggleDebug = function(e) {
      return localStorage.setItem('debug', e.target.checked);
    };

    return About;

  })();

  about = $('<li>About</li>').bind('click', function() {
    $('#main_menu').hide();
    return new About();
  });

  chromus.addMenu(about);

}).call(this);
yepnope({load:["css!./lib/jasmine/jasmine.css","css!./plugins/lastfm/lastfm.css","css!./plugins/vkontakte/vkontakte_style.css"]});