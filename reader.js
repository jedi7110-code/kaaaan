(function(){
  "use strict";

  var sc = document.getElementById("scroll");
  var bar = document.getElementById("bar");
  var toggle = document.getElementById("barToggle");
  var fill = document.getElementById("fill");
  var ticks = document.getElementById("ticks");
  var pct = document.getElementById("pct");
  var book = document.querySelector(".book");
  var fsKey = "kaaaan-font-size";
  var themeKey = "kaaaan-theme";
  var bmKey = "kaaaan-bookmark";

  function stored(key, fallback){
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function store(key, value){
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {}
  }

  function setupMenu(){
    if (!bar || !toggle) return;
    function close(){
      bar.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function(event){
      event.stopPropagation();
      var open = bar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function(event){
      if (!bar.contains(event.target)) close();
    });
    bar.addEventListener("click", function(event){
      if (event.target.closest("nav a")) close();
    });
    document.addEventListener("keydown", function(event){
      if (event.key === "Escape") close();
    });
  }

  function setupFontSize(){
    var dec = document.getElementById("fontDec");
    var inc = document.getElementById("fontInc");
    var size = parseFloat(stored(fsKey, "1")) || 1;
    function apply(){
      document.documentElement.style.setProperty("--fs", size);
      store(fsKey, size);
    }
    function set(next){
      size = Math.min(1.6, Math.max(0.8, Math.round(next * 10) / 10));
      apply();
    }
    if (dec) dec.addEventListener("click", function(){ set(size - 0.1); });
    if (inc) inc.addEventListener("click", function(){ set(size + 0.1); });
    apply();
  }

  function setupTheme(){
    var btn = document.getElementById("themeBtn");
    function apply(theme){
      document.documentElement.classList.toggle("paper", theme === "paper");
      if (btn) btn.textContent = theme === "paper" ? "dark" : "paper";
      store(themeKey, theme);
    }
    var theme = stored(themeKey, "dark");
    apply(theme);
    if (btn) {
      btn.addEventListener("click", function(){
        theme = document.documentElement.classList.contains("paper") ? "dark" : "paper";
        apply(theme);
      });
    }
  }

  function setupProgress(){
    if (!sc || !book || !fill || !ticks || !pct) return;
    function rebuildTicks(){
      ticks.innerHTML = "";
      var total = sc.scrollHeight || 1;
      book.querySelectorAll("h2").forEach(function(h){
        var i = document.createElement("i");
        i.style.top = (h.offsetTop / total * 100) + "%";
        ticks.appendChild(i);
      });
    }
    function update(){
      var max = sc.scrollHeight - sc.clientHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, sc.scrollTop / max)) : 0;
      fill.style.height = (ratio * 100) + "%";
      pct.textContent = Math.round(ratio * 100) + "%";
    }
    sc.addEventListener("scroll", update, {passive:true});
    window.addEventListener("resize", function(){
      rebuildTicks();
      update();
    });
    window.addEventListener("load", function(){
      rebuildTicks();
      update();
    });
    rebuildTicks();
    update();
  }

  function setupBookmark(){
    var btn = document.getElementById("bmBtn");
    var toast = document.getElementById("resume");
    if (!sc) return;

    var ready = false;
    setTimeout(function(){ ready = true; }, 1400);

    var timer = 0;
    sc.addEventListener("scroll", function(){
      if (!ready) return;
      clearTimeout(timer);
      timer = setTimeout(function(){
        store(bmKey, sc.scrollTop);
      }, 450);
    }, {passive:true});

    if (btn) {
      btn.addEventListener("click", function(){
        var saved = parseInt(stored(bmKey, "0"), 10) || 0;
        var original = btn.textContent;
        if (saved > 0 && Math.abs(sc.scrollTop - saved) > 44) {
          sc.scrollTo({top:saved, behavior:"smooth"});
          btn.textContent = "戻る";
        } else {
          store(bmKey, sc.scrollTop);
          btn.textContent = "保存";
        }
        setTimeout(function(){ btn.textContent = original; }, 900);
      });
    }

    window.addEventListener("load", function(){
      var saved = parseInt(stored(bmKey, "0"), 10) || 0;
      var max = sc.scrollHeight - sc.clientHeight;
      if (!toast || saved < Math.max(80, max * 0.05)) return;
      var label = toast.querySelector(".pct");
      if (label && max > 0) label.textContent = Math.round(saved / max * 100) + "%";
      toast.classList.add("show");
      toast.addEventListener("click", function(event){
        event.preventDefault();
        sc.scrollTo({top:saved, behavior:"smooth"});
        toast.classList.remove("show");
      });
      setTimeout(function(){ toast.classList.remove("show"); }, 8000);
    });
  }

  setupMenu();
  setupFontSize();
  setupTheme();
  setupProgress();
  setupBookmark();
})();

