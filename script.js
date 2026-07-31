(function () {
  "use strict";

  var LAYOUTS = [
    {
      id: "full",
      name: "원샷 1컷",
      height: 900,
      panels: [{ top: 0, left: 0, w: 100, h: 100 }],
    },
    {
      id: "stack2",
      name: "세로 2단",
      height: 1100,
      panels: [
        { top: 0, left: 0, w: 100, h: 49 },
        { top: 51, left: 0, w: 100, h: 49 },
      ],
    },
    {
      id: "stack3",
      name: "세로 3단",
      height: 1300,
      panels: [
        { top: 0, left: 0, w: 100, h: 32 },
        { top: 34, left: 0, w: 100, h: 32 },
        { top: 68, left: 0, w: 100, h: 32 },
      ],
    },
    {
      id: "topfull-bottom2",
      name: "상단 풀 + 하단 2분할",
      height: 1100,
      panels: [
        { top: 0, left: 0, w: 100, h: 55 },
        { top: 57, left: 0, w: 48, h: 43 },
        { top: 57, left: 52, w: 48, h: 43 },
      ],
    },
    {
      id: "top2-bottomfull",
      name: "상단 2분할 + 하단 풀",
      height: 1100,
      panels: [
        { top: 0, left: 0, w: 48, h: 43 },
        { top: 0, left: 52, w: 48, h: 43 },
        { top: 45, left: 0, w: 100, h: 55 },
      ],
    },
    {
      id: "grid4",
      name: "2x2 그리드",
      height: 1100,
      panels: [
        { top: 0, left: 0, w: 49, h: 49 },
        { top: 0, left: 51, w: 49, h: 49 },
        { top: 51, left: 0, w: 49, h: 49 },
        { top: 51, left: 51, w: 49, h: 49 },
      ],
    },
    {
      id: "wide-left",
      name: "좌측 와이드 + 우측 2단",
      height: 1100,
      panels: [
        { top: 0, left: 0, w: 64, h: 100 },
        { top: 0, left: 66, w: 34, h: 48 },
        { top: 52, left: 66, w: 34, h: 48 },
      ],
    },
    {
      id: "story4",
      name: "도입-전개-전개-클라이맥스",
      height: 1500,
      panels: [
        { top: 0, left: 0, w: 100, h: 22 },
        { top: 24, left: 0, w: 54, h: 30 },
        { top: 24, left: 56, w: 44, h: 30 },
        { top: 56, left: 0, w: 100, h: 44 },
      ],
    },
  ];

  var CANVAS_W = 800;

  var canvasEl = document.getElementById("canvas");
  var layoutGridEl = document.getElementById("layoutGrid");
  var sceneListEl = document.getElementById("sceneList");

  var sceneSeq = 1;
  var bubbleSeq = 1;

  function makeScene(layoutId) {
    var layout = layoutById(layoutId);
    return {
      id: sceneSeq++,
      layoutId: layout.id,
      panelsState: layout.panels.map(function () {
        return { src: null, posX: 50, posY: 50, scale: 100 };
      }),
      bubblesState: [],
    };
  }

  var scenes = [makeScene(LAYOUTS[0].id)];
  var activeSceneId = scenes[0].id;
  var selectedBubbleId = null;

  function layoutById(id) {
    return LAYOUTS.filter(function (l) {
      return l.id === id;
    })[0];
  }

  function activeIndex() {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === activeSceneId) return i;
    }
    return 0;
  }

  function currentScene() {
    return scenes[activeIndex()];
  }

  function activeLayout() {
    return layoutById(currentScene().layoutId);
  }

  function pct(n) {
    return n + "%";
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /* ---------------- scene list ---------------- */

  function buildMiniThumb(layout) {
    var thumb = document.createElement("div");
    thumb.className = "scene-thumb";
    layout.panels.forEach(function (p) {
      var mini = document.createElement("div");
      mini.className = "thumb-panel";
      mini.style.top = pct(p.top);
      mini.style.left = pct(p.left);
      mini.style.width = pct(p.w);
      mini.style.height = pct(p.h);
      thumb.appendChild(mini);
    });
    return thumb;
  }

  function renderSceneList() {
    sceneListEl.innerHTML = "";
    scenes.forEach(function (scene, idx) {
      var item = document.createElement("div");
      item.className = "scene-item" + (scene.id === activeSceneId ? " active" : "");
      item.appendChild(buildMiniThumb(layoutById(scene.layoutId)));

      var label = document.createElement("div");
      label.className = "scene-label";
      label.textContent = "씬 " + (idx + 1);
      item.appendChild(label);

      var actions = document.createElement("div");
      actions.className = "scene-actions";

      var upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.textContent = "↑";
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        moveScene(idx, -1);
      });
      actions.appendChild(upBtn);

      var downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.textContent = "↓";
      downBtn.disabled = idx === scenes.length - 1;
      downBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        moveScene(idx, 1);
      });
      actions.appendChild(downBtn);

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "scene-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteScene(scene.id);
      });
      actions.appendChild(delBtn);

      item.appendChild(actions);

      item.addEventListener("click", function () {
        selectScene(scene.id);
      });

      sceneListEl.appendChild(item);
    });
  }

  function selectScene(id) {
    if (id === activeSceneId) return;
    activeSceneId = id;
    selectedBubbleId = null;
    renderSceneList();
    renderLayoutGrid();
    renderCanvas();
  }

  function addScene() {
    var scene = makeScene(LAYOUTS[0].id);
    scenes.push(scene);
    selectScene(scene.id);
  }

  function deleteScene(id) {
    if (scenes.length === 1) {
      window.alert("씬은 최소 1개 이상 있어야 합니다.");
      return;
    }
    var ok = window.confirm("이 씬을 삭제할까요? 씬 안의 이미지와 말풍선도 함께 삭제됩니다.");
    if (!ok) return;
    var idx = scenes.findIndex(function (s) {
      return s.id === id;
    });
    scenes.splice(idx, 1);
    if (activeSceneId === id) {
      activeSceneId = scenes[Math.max(0, idx - 1)].id;
    }
    selectedBubbleId = null;
    renderSceneList();
    renderLayoutGrid();
    renderCanvas();
  }

  function moveScene(idx, dir) {
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= scenes.length) return;
    var tmp = scenes[idx];
    scenes[idx] = scenes[newIdx];
    scenes[newIdx] = tmp;
    renderSceneList();
  }

  document.getElementById("addScene").addEventListener("click", addScene);

  /* ---------------- layout picker (applies to active scene) ---------------- */

  function renderLayoutGrid() {
    layoutGridEl.innerHTML = "";
    var scene = currentScene();
    LAYOUTS.forEach(function (layout) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "layout-btn" + (layout.id === scene.layoutId ? " active" : "");
      btn.appendChild(buildMiniThumb(layout));
      var thumbEl = btn.firstChild;
      thumbEl.className = "layout-thumb";
      var label = document.createElement("div");
      label.className = "layout-name";
      label.textContent = layout.name;
      btn.appendChild(label);
      btn.addEventListener("click", function () {
        selectLayout(layout.id);
      });
      layoutGridEl.appendChild(btn);
    });
  }

  function selectLayout(id) {
    var scene = currentScene();
    if (id === scene.layoutId) return;
    var layout = layoutById(id);
    if (scene.panelsState.some(function (p) { return p && p.src; })) {
      var ok = window.confirm("레이아웃을 바꾸면 이 씬에 넣은 이미지가 초기화됩니다. 계속할까요?");
      if (!ok) return;
    }
    scene.layoutId = layout.id;
    scene.panelsState = layout.panels.map(function () {
      return { src: null, posX: 50, posY: 50, scale: 100 };
    });
    renderLayoutGrid();
    renderSceneList();
    renderCanvas();
  }

  /* ---------------- canvas / panels ---------------- */

  function renderCanvas() {
    var layout = activeLayout();
    var scene = currentScene();
    canvasEl.style.width = CANVAS_W + "px";
    canvasEl.style.height = layout.height + "px";
    canvasEl.innerHTML = "";

    layout.panels.forEach(function (rect, index) {
      canvasEl.appendChild(buildPanelElement(rect, index, scene, layout.height));
    });

    var bubbleLayer = document.createElement("div");
    bubbleLayer.id = "bubbleLayer";
    canvasEl.appendChild(bubbleLayer);

    renderBubbles();
  }

  function buildPanelElement(rect, index, scene, layoutHeight) {
    var panel = document.createElement("div");
    panel.className = "panel";
    panel.style.top = pct(rect.top);
    panel.style.left = pct(rect.left);
    panel.style.width = pct(rect.w);
    panel.style.height = pct(rect.h);
    panel.dataset.index = index;

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          scene.panelsState[index] = {
            src: reader.result,
            naturalW: img.naturalWidth,
            naturalH: img.naturalHeight,
            posX: 50,
            posY: 50,
            scale: 100,
          };
          applyPanelBackground(panel, index, scene, rect, layoutHeight);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      fileInput.value = "";
    });
    panel.appendChild(fileInput);

    var placeholder = document.createElement("div");
    placeholder.className = "panel-placeholder";
    placeholder.innerHTML = '<div class="plus">+</div><div>이미지 업로드</div>';
    panel.appendChild(placeholder);

    var controls = document.createElement("div");
    controls.className = "panel-controls";
    var changeBtn = document.createElement("button");
    changeBtn.type = "button";
    changeBtn.textContent = "변경";
    changeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      fileInput.click();
    });
    var resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "초기화";
    resetBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      scene.panelsState[index] = { src: null, posX: 50, posY: 50, scale: 100 };
      applyPanelBackground(panel, index, scene, rect, layoutHeight);
    });
    controls.appendChild(changeBtn);
    controls.appendChild(resetBtn);
    panel.appendChild(controls);

    panel.addEventListener("click", function () {
      if (!scene.panelsState[index] || !scene.panelsState[index].src) fileInput.click();
    });

    panel.addEventListener("mousedown", function (e) {
      if (e.target !== panel) return;
      if (!scene.panelsState[index] || !scene.panelsState[index].src) return;
      deselectAllBubbles();
      startPanelDrag(e, panel, index, scene, rect, layoutHeight);
    });

    panel.addEventListener("wheel", function (e) {
      if (!scene.panelsState[index] || !scene.panelsState[index].src) return;
      e.preventDefault();
      var state = scene.panelsState[index];
      state.scale = Math.max(100, Math.min(400, state.scale - e.deltaY * 0.1));
      applyPanelBackground(panel, index, scene, rect, layoutHeight);
    });

    applyPanelBackground(panel, index, scene, rect, layoutHeight);
    return panel;
  }

  function applyPanelBackground(panel, index, scene, rect, layoutHeight) {
    var state = scene.panelsState[index];
    var placeholder = panel.querySelector(".panel-placeholder");
    if (state && state.src) {
      panel.classList.add("has-image");
      placeholder.style.display = "none";
      panel.style.backgroundImage = "url(" + state.src + ")";

      if (state.naturalW && state.naturalH) {
        var panelW = (rect.w / 100) * CANVAS_W;
        var panelH = (rect.h / 100) * layoutHeight;
        var coverScale = Math.max(panelW / state.naturalW, panelH / state.naturalH);
        var effectiveScale = coverScale * (state.scale / 100);
        var renderedW = state.naturalW * effectiveScale;
        var renderedH = state.naturalH * effectiveScale;
        panel.style.backgroundSize = renderedW + "px " + renderedH + "px";
      } else {
        panel.style.backgroundSize = "cover";
      }
      panel.style.backgroundPosition = state.posX + "% " + state.posY + "%";
    } else {
      panel.classList.remove("has-image");
      placeholder.style.display = "";
      panel.style.backgroundImage = "none";
    }
  }

  function startPanelDrag(e, panel, index, scene, panelRect, layoutHeight) {
    e.preventDefault();
    var state = scene.panelsState[index];
    var domRect = panel.getBoundingClientRect();
    var startX = e.clientX;
    var startY = e.clientY;
    var startPosX = state.posX;
    var startPosY = state.posY;
    panel.classList.add("dragging");

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      state.posX = clamp(startPosX - (dx / domRect.width) * 100, 0, 100);
      state.posY = clamp(startPosY - (dy / domRect.height) * 100, 0, 100);
      applyPanelBackground(panel, index, scene, panelRect, layoutHeight);
    }
    function onUp() {
      panel.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  /* ---------------- bubbles ---------------- */

  function addBubble(type) {
    var scene = currentScene();
    var canvasH = activeLayout().height;
    var w = 160;
    var h = 80;
    scene.bubblesState.push({
      id: bubbleSeq++,
      type: type,
      left: CANVAS_W / 2 - w / 2,
      top: canvasH / 2 - h / 2,
      width: w,
      height: h,
      text: "텍스트를 입력하세요",
    });
    renderBubbles();
    selectBubble(scene.bubblesState[scene.bubblesState.length - 1].id);
  }

  function renderBubbles() {
    var layer = document.getElementById("bubbleLayer");
    if (!layer) return;
    layer.innerHTML = "";
    currentScene().bubblesState.forEach(function (b) {
      layer.appendChild(buildBubbleElement(b));
    });
  }

  function buildBubbleElement(b) {
    var el = document.createElement("div");
    el.className = "bubble " + b.type + (b.id === selectedBubbleId ? " selected" : "");
    el.style.left = b.left + "px";
    el.style.top = b.top + "px";
    el.style.width = b.width + "px";
    el.style.height = b.height + "px";
    el.dataset.id = b.id;

    if (b.type === "thought") {
      var dot1 = document.createElement("div");
      dot1.className = "thought-dot";
      dot1.style.width = "16px";
      dot1.style.height = "16px";
      dot1.style.left = "18px";
      dot1.style.bottom = "-24px";
      el.appendChild(dot1);
      var dot2 = document.createElement("div");
      dot2.className = "thought-dot";
      dot2.style.width = "9px";
      dot2.style.height = "9px";
      dot2.style.left = "6px";
      dot2.style.bottom = "-34px";
      el.appendChild(dot2);
    }

    var text = document.createElement("div");
    text.className = "bubble-text";
    text.contentEditable = "true";
    text.textContent = b.text;
    text.addEventListener("input", function () {
      b.text = text.textContent;
    });
    text.addEventListener("mousedown", function (e) {
      if (document.activeElement === text) e.stopPropagation();
    });
    el.appendChild(text);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "bubble-delete";
    del.textContent = "×";
    del.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    del.addEventListener("click", function (e) {
      e.stopPropagation();
      deleteBubble(b.id);
    });
    el.appendChild(del);

    var handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      startBubbleResize(e, b);
    });
    el.appendChild(handle);

    el.addEventListener("mousedown", function (e) {
      if (e.target === text && document.activeElement === text) return;
      selectBubble(b.id);
      startBubbleDrag(e, b);
    });

    el.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      text.focus();
      placeCaretAtEnd(text);
    });

    return el;
  }

  function placeCaretAtEnd(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function selectBubble(id) {
    selectedBubbleId = id;
    renderBubbles();
  }

  function deselectAllBubbles() {
    if (selectedBubbleId === null) return;
    selectedBubbleId = null;
    renderBubbles();
  }

  function deleteBubble(id) {
    var scene = currentScene();
    scene.bubblesState = scene.bubblesState.filter(function (b) {
      return b.id !== id;
    });
    if (selectedBubbleId === id) selectedBubbleId = null;
    renderBubbles();
  }

  function startBubbleDrag(e, b) {
    e.preventDefault();
    var startX = e.clientX;
    var startY = e.clientY;
    var startLeft = b.left;
    var startTop = b.top;
    var canvasH = activeLayout().height;

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      b.left = clamp(startLeft + dx, -b.width * 0.4, CANVAS_W - b.width * 0.6);
      b.top = clamp(startTop + dy, -b.height * 0.4, canvasH - b.height * 0.6);
      renderBubbles();
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startBubbleResize(e, b) {
    e.preventDefault();
    var startX = e.clientX;
    var startY = e.clientY;
    var startW = b.width;
    var startH = b.height;

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      b.width = clamp(startW + dx, 60, 700);
      b.height = clamp(startH + dy, 36, 700);
      renderBubbles();
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  document.addEventListener("keydown", function (e) {
    if (selectedBubbleId === null) return;
    var active = document.activeElement;
    var editing = active && active.classList && active.classList.contains("bubble-text");
    if (editing) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteBubble(selectedBubbleId);
    }
  });

  document.querySelectorAll(".bubble-buttons button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addBubble(btn.dataset.type);
    });
  });

  /* ---------------- export: stitch every scene together ---------------- */

  function captureAllScenes() {
    var originalActiveId = activeSceneId;
    var originalSelected = selectedBubbleId;
    selectedBubbleId = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.body.classList.add("exporting");

    var captures = [];
    var i = 0;

    function next() {
      if (i >= scenes.length) {
        document.body.classList.remove("exporting");
        activeSceneId = originalActiveId;
        selectedBubbleId = originalSelected;
        renderSceneList();
        renderLayoutGrid();
        renderCanvas();
        return Promise.resolve(captures);
      }
      activeSceneId = scenes[i].id;
      renderCanvas();
      return new Promise(function (resolve) {
        setTimeout(function () {
          html2canvas(canvasEl, { backgroundColor: "#ffffff", scale: 2, useCORS: true }).then(function (canvas) {
            captures.push(canvas);
            i++;
            resolve(next());
          });
        }, 0);
      });
    }

    return next();
  }

  function triggerDownload(href, filename) {
    var link = document.createElement("a");
    link.download = filename;
    link.href = href;
    link.click();
  }

  document.getElementById("exportPng").addEventListener("click", function () {
    captureAllScenes().then(function (captures) {
      var totalHeight = captures.reduce(function (sum, c) {
        return sum + c.height;
      }, 0);
      var maxWidth = captures.reduce(function (max, c) {
        return Math.max(max, c.width);
      }, 0);

      var combined = document.createElement("canvas");
      combined.width = maxWidth;
      combined.height = totalHeight;
      var ctx = combined.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      var y = 0;
      captures.forEach(function (c) {
        ctx.drawImage(c, 0, y);
        y += c.height;
      });

      triggerDownload(combined.toDataURL("image/png"), "webtoon_episode.png");
    });
  });

  document.getElementById("exportPdf").addEventListener("click", function () {
    captureAllScenes().then(function (captures) {
      var jsPDFCtor = window.jspdf.jsPDF;
      var first = captures[0];
      var pdf = new jsPDFCtor({
        orientation: first.height > first.width ? "p" : "l",
        unit: "px",
        format: [first.width, first.height],
      });
      captures.forEach(function (c, idx) {
        if (idx > 0) {
          pdf.addPage([c.width, c.height], c.height > c.width ? "p" : "l");
        }
        pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, c.width, c.height);
      });
      pdf.save("webtoon_episode.pdf");
    });
  });

  /* ---------------- init ---------------- */

  renderSceneList();
  renderLayoutGrid();
  renderCanvas();
})();
