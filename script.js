//open links from the extension action popup
    const popupLinkTargets = () => {
      if(location.hash == '#popup') {
        const links = document.querySelectorAll('.link')
        links.forEach(el => {
          el.setAttribute('target','_blank')
        })
      }
    }
    popupLinkTargets()

    //--------------------Drag & Drop------------------------------
    let dragSrcEl

    const dragStart = (e) => {
      if (e.target.classList.contains('m')) {
        dragSrcEl = e.currentTarget
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
      } else e.preventDefault()
    }

    const dragOver = (e) =>{
      if (e.preventDefault) e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      return false
    }

    let dragEnterTarget;

    const dragEnter = (e) => {
      const target = e.target.closest('LI')
      if (target) {
        target.classList.add('over')
        dragEnterTarget = target
      } else {
        //dragged outside dropzone, cancel all meetings
        l.querySelectorAll('LI').forEach((el) => {
          el.classList.remove('over')
        })
      }
    }

    const dragLeave = (e) => {
      l.querySelectorAll('LI').forEach((el) => {
        if (el !== dragEnterTarget) el.classList.remove('over')
      })
    }

    const drop = (e) => {
      if (e.stopPropagation) e.stopPropagation()
      let dropElem
      if (dragSrcEl != e.currentTarget) {
        e.currentTarget.parentNode.removeChild(dragSrcEl)
        const dropHTML = e.dataTransfer.getData('text/html')
        e.currentTarget.insertAdjacentHTML('beforebegin',dropHTML)
        dropElem = e.currentTarget.previousSibling
        addDnDHandlers(dropElem)
      }
      e.currentTarget.classList.remove('over')
      save()
      if (dropElem) itemDeleteHandler(dropElem.querySelector('.d'))
      return false
    }

    const addDnDHandlers = (el) => {
      el.addEventListener('dragstart', dragStart)
      el.addEventListener('dragenter', dragEnter)
      el.addEventListener('dragover', dragOver)
      el.addEventListener('dragleave', dragLeave)
      el.addEventListener('drop', drop)
    }
    l.querySelectorAll('LI').forEach((el) => {
      addDnDHandlers(el)
    })
    //dragged outside dropzone
    window.addEventListener('dragenter', dragEnter)

    // drop2Edit
    const d2e_dragEnter = (e) => e.target.classList.add('over')
    const d2e_dragLeave = (e) => e.target.classList.remove('over')
    let modifyItemFromLinkForm
    const _modifyItemFromLinkForm = (elToBeReplaced) => {
      addNewItem(url.value, title.value, icon.value, iconPick.files[0],elToBeReplaced)
      title.value = ''
      url.value   = ''
      icon.value  = ''
      iconPick.value = ''
      mt.checked = false
      options.removeAttribute('open')
      add.removeEventListener('click', modifyItemFromLinkForm)
      add.addEventListener('click', addNewItemFromLinkForm)
      n.querySelector('h2').innerHTML='Add New link'
      save()
    }

    const d2e_drop = (e) => {
      if (e.stopPropagation) e.stopPropagation()
      n.querySelector('h2').innerHTML='Modify Link'
      drop2Edit.classList.remove('over')
      options.setAttribute('open','')
      const doc = new DOMParser().parseFromString(e.dataTransfer.getData('text/html'), "text/html")
      title.value = doc.querySelector('.title').innerHTML
      url.value   = doc.querySelector('.link').getAttribute('href')
      icon.value  = doc.querySelector('.f').getAttribute('src')
      add.removeEventListener('click', addNewItemFromLinkForm)
      modifyItemFromLinkForm = () => _modifyItemFromLinkForm(dragSrcEl)
      add.addEventListener('click', modifyItemFromLinkForm)
      return false
    }

    drop2Edit.addEventListener('dragover', dragOver)
    drop2Edit.addEventListener('dragenter', d2e_dragEnter)
    drop2Edit.addEventListener('dragleave', d2e_dragLeave)
    drop2Edit.addEventListener('drop', d2e_drop)

    //----------------------Link Handling-----------------------

    //data to be saved
    const getLinksFromHtml = () => {
      const arr = []
      l.querySelectorAll('LI').forEach((el) => {
        arr.push ( {"link":el.querySelector('.link').href,"title":el.querySelector('.title').innerHTML,"icon":el.querySelector('.f').src} )
      })
      return JSON.stringify(arr.reverse())
    }

    const save = () => {
      localStorage.setItem('sp-links', getLinksFromHtml())
      popupLinkTargets()
    }
    const fragmentFromString = (strHTML) => document.createRange().createContextualFragment(strHTML);
    const noWWW = (str) => str.replace("www.", "")

    //add new item from json or form
    const addNewItem = (loadUrl,loadTitle,loadIconUrl,file,elToBeReplaced=null) => {
      const realUrl = new URL(loadUrl)
      const realTitle = loadTitle || noWWW(realUrl.hostname)
      let realIcon = loadIconUrl || `https://www.google.com/s2/favicons?sz=32&domain_url=${realUrl.host}`
      const prependLink = () => {
        const frag = fragmentFromString(`
        <li>
          <button class=d title="Delete This Link">×</button>
          <a class=link href="${realUrl}">
            <img class=f src="${realIcon}">
            <span class="title">${realTitle}</span>
          </a>
          <i draggable=true class=m title="Drag This Link To Another Position"></i>
        </li>`)
        addDnDHandlers(frag.querySelector('li'))
        itemDeleteHandler(frag.querySelector('.d'))
        if(elToBeReplaced) elToBeReplaced.replaceWith(frag)
        else l.prepend(frag)
      }
      // user selected a local image as icon
      if (file) {
        const promise = getLocalImageAsDataUri()
        promise.then(dataUri => realIcon = dataUri).catch().finally(() => {
          prependLink()
          save()
        })
      } else {
        prependLink()
        save()
      }
    }

    const getLocalImageAsDataUri = () => {
      return new Promise(function(resolve) {
        const file = iconPick.files[0]
        const reader = new FileReader()
        reader.addEventListener('load', function () {
          const image = new Image()
          image.crossOrigin = ''
          image.addEventListener('load',() => {
            const canvas = document.createElement('canvas')
            canvas.width = 22
            canvas.height = 22
            const ratio = image.naturalWidth / image.naturalHeight
            const width = canvas.width
            const height = width / ratio
            canvas.getContext('2d').drawImage(image, 0, 0, width, height)
            resolve(canvas.toDataURL('image/png'))
          })
          image.src = reader.result
        })
        reader.readAsDataURL(file)
      })
    }

    //deleting items
    const itemDeleteHandler = (x) => {
      x.addEventListener('click', (e) => {
        e.currentTarget.parentElement.remove()
        save()
      })
    }
    document.querySelectorAll('.d').forEach((x) => itemDeleteHandler(x))

    //new link form
    const addNewItemFromLinkForm = () => {
      addNewItem(url.value, title.value, icon.value, iconPick.files[0])
      title.value = ''
      url.value   = ''
      icon.value  = ''
      iconPick.value = ''
      mt.checked = false
    }
    //add new item via save button
    add.addEventListener('click', addNewItemFromLinkForm)

    //also add new item via return key
    mt.addEventListener('change', (e) => {
      if (e.currentTarget.checked) {
        url.focus()
        n.addEventListener('keydown', (e) => {
          if (event.keyCode == 13) addNewItemFromLinkForm()
        })
      } else save()
    })

    //disable autocomplete on mobile devices
    if (window.innerWidth < 600) url.setAttribute( "autocomplete", "off" );

    //loading links from localstorage json or file
    const loadLinks = (str) => {
      const links = str? JSON.parse(str) : JSON.parse(localStorage.getItem('sp-links'))
      if (links) {
        l.innerHTML = ''
        links.forEach((link) => {
          addNewItem(link.link, link.title, link.icon)
        })
      }
    }
    loadLinks()

    //backup
    const backup = () => {
      const el = document.createElement('a');
      el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(localStorage.getItem('sp-links')))
      el.setAttribute('download', 'StartPageLinks.json')
      el.style.display = 'none'
      document.body.appendChild(el)
      el.click()
      document.body.removeChild(el)
    }
    dl.addEventListener('click', backup)

    //import
    const sel = document.getElementById('import');
    sel.addEventListener('change', (event) => {
      let str = ''
      const file = event.target.files[0];
      const reader = new FileReader()
      reader.addEventListener('load', event => {
        str = event.target.result
        loadLinks(str)
        save()
      })
      reader.readAsText(file)
    })


    //---------------touch events translated to html5 drag / drop events--------------
    // source: https://gist.github.com/theanam/bd1bba1e79882f87f11532384c80c2f9

    var DragDropTouch;
    (function (DragDropTouch_1) {
        'use strict';

        var DataTransfer = (function () {
            function DataTransfer() {
                this._dropEffect = 'move';
                this._effectAllowed = 'all';
                this._data = {};
            }
            Object.defineProperty(DataTransfer.prototype, "dropEffect", {
                get: function () {
                    return this._dropEffect;
                },
                set: function (value) {
                    this._dropEffect = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DataTransfer.prototype, "effectAllowed", {
                get: function () {
                    return this._effectAllowed;
                },
                set: function (value) {
                    this._effectAllowed = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DataTransfer.prototype, "types", {
                get: function () {
                    return Object.keys(this._data);
                },
                enumerable: true,
                configurable: true
            });

            DataTransfer.prototype.clearData = function (type) {
                if (type != null) {
                    delete this._data[type];
                }
                else {
                    this._data = null;
                }
            };

            DataTransfer.prototype.getData = function (type) {
                return this._data[type] || '';
            };

            DataTransfer.prototype.setData = function (type, value) {
                this._data[type] = value;
            };

            DataTransfer.prototype.setDragImage = function (img, offsetX, offsetY) {
                var ddt = DragDropTouch._instance;
                ddt._imgCustom = img;
                ddt._imgOffset = { x: offsetX, y: offsetY };
            };
            return DataTransfer;
        })();
        DragDropTouch_1.DataTransfer = DataTransfer;

        var DragDropTouch = (function () {

            function DragDropTouch() {
                this._lastClick = 0;
                // enforce singleton pattern
                if (DragDropTouch._instance) {
                    throw 'DragDropTouch instance already created.';
                }
                // listen to touch events
                if ('ontouchstart' in document) {
                    var d = document, ts = this._touchstart.bind(this), tm = this._touchmove.bind(this), te = this._touchend.bind(this);
                    d.addEventListener('touchstart', ts);
                    d.addEventListener('touchmove', tm);
                    d.addEventListener('touchend', te);
                    d.addEventListener('touchcancel', te);
                }
            }

            DragDropTouch.getInstance = function () {
                return DragDropTouch._instance;
            };
            // ** event handlers
            DragDropTouch.prototype._touchstart = function (e) {
                var _this = this;
                if (this._shouldHandle(e)) {
                    // raise double-click and prevent zooming
                    if (Date.now() - this._lastClick < DragDropTouch._DBLCLICK) {
                        if (this._dispatchEvent(e, 'dblclick', e.target)) {
                            e.preventDefault();
                            this._reset();
                            return;
                        }
                    }
                    // clear all variables
                    this._reset();
                    // get nearest draggable element
                    var src = this._closestDraggable(e.target);
                    if (src) {
                        // give caller a chance to handle the hover/move events
                        if (!this._dispatchEvent(e, 'mousemove', e.target) &&
                            !this._dispatchEvent(e, 'mousedown', e.target)) {
                            // get ready to start dragging
                            this._dragSource = src;
                            this._ptDown = this._getPoint(e);
                            this._lastTouch = e;
                            e.preventDefault();
                            // show context menu if the user hasn't started dragging after a while
                            setTimeout(function () {
                                if (_this._dragSource == src && _this._img == null) {
                                    if (_this._dispatchEvent(e, 'contextmenu', src)) {
                                        _this._reset();
                                    }
                                }
                            }, DragDropTouch._CTXMENU);
                        }
                    }
                }
            };
            DragDropTouch.prototype._touchmove = function (e) {
                if (this._shouldHandle(e)) {
                    // see if target wants to handle move
                    var target = this._getTarget(e);
                    if (this._dispatchEvent(e, 'mousemove', target)) {
                        this._lastTouch = e;
                        e.preventDefault();
                        return;
                    }
                    // start dragging
                    if (this._dragSource && !this._img) {
                        var delta = this._getDelta(e);
                        if (delta > DragDropTouch._THRESHOLD) {
                            this._dispatchEvent(e, 'dragstart', this._dragSource);
                            this._createImage(e);
                            this._dispatchEvent(e, 'dragenter', target);
                        }
                    }
                    // continue dragging
                    if (this._img) {
                        this._lastTouch = e;
                        e.preventDefault(); // prevent scrolling
                        if (target != this._lastTarget) {
                            this._dispatchEvent(this._lastTouch, 'dragleave', this._lastTarget);
                            this._dispatchEvent(e, 'dragenter', target);
                            this._lastTarget = target;
                        }
                        this._moveImage(e);
                        this._dispatchEvent(e, 'dragover', target);
                    }
                }
            };
            DragDropTouch.prototype._touchend = function (e) {
                if (this._shouldHandle(e)) {
                    // see if target wants to handle up
                    if (this._dispatchEvent(this._lastTouch, 'mouseup', e.target)) {
                        e.preventDefault();
                        return;
                    }
                    // user clicked the element but didn't drag, so clear the source and simulate a click
                    if (!this._img) {
                        this._dragSource = null;
                        this._dispatchEvent(this._lastTouch, 'click', e.target);
                        this._lastClick = Date.now();
                    }
                    // finish dragging
                    this._destroyImage();
                    if (this._dragSource) {
                        if (e.type.indexOf('cancel') < 0) {
                            this._dispatchEvent(this._lastTouch, 'drop', this._lastTarget);
                        }
                        this._dispatchEvent(this._lastTouch, 'dragend', this._dragSource);
                        this._reset();
                    }
                }
            };
            // ** utilities
            // ignore events that have been handled or that involve more than one touch
            DragDropTouch.prototype._shouldHandle = function (e) {
                return e &&
                    !e.defaultPrevented &&
                    e.touches && e.touches.length < 2;
            };
            // clear all members
            DragDropTouch.prototype._reset = function () {
                this._destroyImage();
                this._dragSource = null;
                this._lastTouch = null;
                this._lastTarget = null;
                this._ptDown = null;
                this._dataTransfer = new DataTransfer();
            };
            // get point for a touch event
            DragDropTouch.prototype._getPoint = function (e, page) {
                if (e && e.touches) {
                    e = e.touches[0];
                }
                return { x: page ? e.pageX : e.clientX, y: page ? e.pageY : e.clientY };
            };
            // get distance between the current touch event and the first one
            DragDropTouch.prototype._getDelta = function (e) {
                var p = this._getPoint(e);
                return Math.abs(p.x - this._ptDown.x) + Math.abs(p.y - this._ptDown.y);
            };
            // get the element at a given touch event
            DragDropTouch.prototype._getTarget = function (e) {
                var pt = this._getPoint(e), el = document.elementFromPoint(pt.x, pt.y);
                while (el && getComputedStyle(el).pointerEvents == 'none') {
                    el = el.parentElement;
                }
                return el;
            };
            // create drag image from source element
            DragDropTouch.prototype._createImage = function (e) {
                // just in case...
                if (this._img) {
                    this._destroyImage();
                }
                // create drag image from custom element or drag source
                var src = this._imgCustom || this._dragSource;
                this._img = src.cloneNode(true);
                this._copyStyle(src, this._img);
                this._img.style.top = this._img.style.left = '-9999px';
                // if creating from drag source, apply offset and opacity
                if (!this._imgCustom) {
                    var rc = src.getBoundingClientRect(), pt = this._getPoint(e);
                    this._imgOffset = { x: pt.x - rc.left, y: pt.y - rc.top };
                    this._img.style.opacity = DragDropTouch._OPACITY.toString();
                }
                // add image to document
                this._moveImage(e);
                document.body.appendChild(this._img);
            };
            // dispose of drag image element
            DragDropTouch.prototype._destroyImage = function () {
                if (this._img && this._img.parentElement) {
                    this._img.parentElement.removeChild(this._img);
                }
                this._img = null;
                this._imgCustom = null;
            };
            // move the drag image element
            DragDropTouch.prototype._moveImage = function (e) {
                var _this = this;
                requestAnimationFrame(function () {
                    var pt = _this._getPoint(e, true), s = _this._img.style;
                    s.position = 'absolute';
                    s.pointerEvents = 'none';
                    s.zIndex = '999999';
                    s.left = Math.round(pt.x - _this._imgOffset.x) + 'px';
                    s.top = Math.round(pt.y - _this._imgOffset.y) + 'px';
                });
            };
            // copy properties from an object to another
            DragDropTouch.prototype._copyProps = function (dst, src, props) {
                for (var i = 0; i < props.length; i++) {
                    var p = props[i];
                    dst[p] = src[p];
                }
            };
            DragDropTouch.prototype._copyStyle = function (src, dst) {
                // remove potentially troublesome attributes
                DragDropTouch._rmvAtts.forEach(function (att) {
                    dst.removeAttribute(att);
                });
                // copy canvas content
                if (src instanceof HTMLCanvasElement) {
                    var cSrc = src, cDst = dst;
                    cDst.width = cSrc.width;
                    cDst.height = cSrc.height;
                    cDst.getContext('2d').drawImage(cSrc, 0, 0);
                }
                // copy style
                var cs = getComputedStyle(src);
                for (var i = 0; i < cs.length; i++) {
                    var key = cs[i];
                    dst.style[key] = cs[key];
                }
                dst.style.pointerEvents = 'none';
                // and repeat for all children
                for (var i = 0; i < src.children.length; i++) {
                    this._copyStyle(src.children[i], dst.children[i]);
                }
            };
            DragDropTouch.prototype._dispatchEvent = function (e, type, target) {
                if (e && target) {
                    var evt = document.createEvent('Event'), t = e.touches ? e.touches[0] : e;
                    evt.initEvent(type, true, true);
                    evt.button = 0;
                    evt.which = evt.buttons = 1;
                    this._copyProps(evt, e, DragDropTouch._kbdProps);
                    this._copyProps(evt, t, DragDropTouch._ptProps);
                    evt.dataTransfer = this._dataTransfer;
                    target.dispatchEvent(evt);
                    return evt.defaultPrevented;
                }
                return false;
            };
            // gets an element's closest draggable ancestor
            DragDropTouch.prototype._closestDraggable = function (e) {
                for (; e; e = e.parentElement) {
                    if (e.hasAttribute('draggable')) {
                        return e;
                    }
                }
                return null;
            };
            /*private*/ DragDropTouch._instance = new DragDropTouch(); // singleton
            // constants
            DragDropTouch._THRESHOLD = 5; // pixels to move before drag starts
            DragDropTouch._OPACITY = 0.5; // drag image opacity
            DragDropTouch._DBLCLICK = 500; // max ms between clicks in a double click
            DragDropTouch._CTXMENU = 900; // ms to hold before raising 'contextmenu' event
            // copy styles/attributes from drag source to drag image element
            DragDropTouch._rmvAtts = 'id,class,style,draggable'.split(',');
            // synthesize and dispatch an event
            // returns true if the event has been handled (e.preventDefault == true)
            DragDropTouch._kbdProps = 'altKey,ctrlKey,metaKey,shiftKey'.split(',');
            DragDropTouch._ptProps = 'pageX,pageY,clientX,clientY,screenX,screenY'.split(',');
            return DragDropTouch;
        })();
        DragDropTouch_1.DragDropTouch = DragDropTouch;
    })(DragDropTouch || (DragDropTouch = {}));