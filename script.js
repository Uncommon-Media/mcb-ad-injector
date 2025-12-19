/***************************************************************
 * Inject Adhese script first, then init and run everything else
 ***************************************************************/
function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

class AdInjector {
  constructor(config) {
    this.config = config;
    this.adhese = null;
    this.init();
  }

  init() {
    this.loadAdheseScript()
      .then(() => {
        console.log("Adhese script loaded");
        this.initAdhese();
        this.createAdSlots();
        this.loadAdsOnPageLoad();
      })
      .catch((err) => {
        console.error("Failed to load Adhese script", err);
      });
  }

  loadAdheseScript() {
    return loadExternalScript(
      "https://cdn.jsdelivr.net/gh/geralders/geralderstest@main/adhese_tag.js"
    );
  }

  initAdhese() {
    const vSetting = {
      settings: {
        inViewPercentage: "0.5",
        duration: 5,
      },
    };

    this.adhese = new window.Adhese();
    this.adhese.init({
      debug: true,
      account: "uncommonmedia",
      type: "staging",
      location: this.getLocation,
      safeframe: false,
      viewabilityTracking: false || vSetting,
      findDomSlotsOnLoad: false,
    });
    window._adhese = this.adhese; // For debugging
  }

  getLocation() {
    return "_demopage__one_";
  }

  createAdSlots() {
    setTimeout(() => {
      this.createStyledDiv(
        "970x250",
        970,
        250,
        this.config.verticalSlotSelector,
        "Centered 970x250 Box"
      );
      this.createStyledDiv(
        "300x250",
        300,
        250,
        this.config.interrupterSelector,
        "Centered 300x250 Box",
        true
      );
      this.createFloatingDivs(
        this.config.gapBetweenFloatingDivs,
        this.config.leftOffsetAdjustment
      );
    }, this.config.insertionDelay);
  }

  createStyledDiv(id, width, height, parentSelector, text, clearFirstChild = false) {
    const parent = document.querySelector(parentSelector);
    if (parent) {
      if (clearFirstChild && parent.firstElementChild) {
        parent.removeChild(parent.firstElementChild);
      }

      const wrapper = document.createElement("div");
      Object.assign(wrapper.style, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "auto",
        width: "100%",
      });
      
      const newDiv = document.createElement("div");
      newDiv.id = id;
      newDiv.classList.add("ad_tag");
      newDiv.textContent = text;

      Object.assign(newDiv.style, {
        width: `${width}px`,
        height: `${height}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f8f8",
        margin: "auto",
      });
      
      wrapper.appendChild(newDiv);
      parent.appendChild(wrapper);

    } else {
      console.error(`No element found matching "${parentSelector}".`);
    }
  }

  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  createFloatingDivs(gap, leftAdjust = 0) {
    const leftDiv = document.createElement("div");
    leftDiv.id = "160x600";
    leftDiv.classList.add("ad_tag");
    leftDiv.textContent = "Left 160x600";
    Object.assign(leftDiv.style, {
      width: "160px",
      height: "600px",
      backgroundColor: "#f8f8f8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "fixed",
      top: "50%",
      transform: "translateY(-50%)",
    });
    document.body.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.id = "300x600";
    rightDiv.classList.add("ad_tag");
    rightDiv.textContent = "Right 300x600";
    Object.assign(rightDiv.style, {
      width: "300px",
      height: "600px",
      backgroundColor: "#f8f8f8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "fixed",
      top: "50%",
      transform: "translateY(-50%)",
    });
    document.body.appendChild(rightDiv);

    const positionDivs = () => {
      const center = window.innerWidth / 2;
      const leftWidth = 160;
      const leftInnerEdge = center - gap / 2;
      const rightInnerEdge = center + gap / 2;
      leftDiv.style.left = `${leftInnerEdge - leftWidth - leftAdjust}px`;
      rightDiv.style.left = `${rightInnerEdge}px`;
    };

    positionDivs();
    window.addEventListener("resize", this.debounce(positionDivs, 250));
  }

  loadAds() {
    if (!this.adhese || !window.AdheseAjax) {
      console.error("Adhese library not ready");
      return;
    }

    const elements = document.querySelectorAll(".ad_tag");
    const adArr = [];
    const slotIndex = {};
    elements.forEach((el) => {
      const baseSlot = el.getAttribute("id");
      slotIndex[baseSlot] = (slotIndex[baseSlot] || 0) + 1;
      const uniqueId = `${baseSlot}_${slotIndex[baseSlot]}`;
      el.setAttribute("id", uniqueId);
      el.dataset.baseSlot = baseSlot;
    });

    const slotCount = {};
    elements.forEach((el) => {
      const baseSlot = el.dataset.baseSlot;
      slotCount[baseSlot] = (slotCount[baseSlot] || 0) + 1;
    });

    const positionTracker = {};
    elements.forEach((el) => {
      const baseSlot = el.dataset.baseSlot;
      if (slotCount[baseSlot] > 1) {
        if (positionTracker[baseSlot] === undefined) {
          positionTracker[baseSlot] = 1;
        }
        const pos = positionTracker[baseSlot]++;
        const options = { write: false, position: pos };
        const tag = this.adhese.tag(baseSlot, options);
        adArr.push(tag);
        console.log(`Requesting slot ${baseSlot} with position ${pos}`);
      } else {
        const tag = this.adhese.tag(baseSlot, { write: false });
        adArr.push(tag);
        console.log(`Requesting slot ${baseSlot} without pos`);
      }
    });

    this.adhese.registerRequestParameter("br", "elektronik");

    const adUri = this.adhese.getMultipleRequestUri(adArr, { type: "json" });
    console.log("Ad request URI:", adUri);

    window.AdheseAjax.request({
      url: adUri,
      method: "get",
      json: true,
    })
    .done((result) => {
      console.log("Adhese response:", result);
      const adMap = {};
      result.forEach((ad) => {
        const size = ad.adType;
        if (!adMap[size]) adMap[size] = [];
        adMap[size].push(ad);
      });

      elements.forEach((container) => {
        const baseSlot = container.dataset.baseSlot;
        const adsForSize = adMap[baseSlot];
        if (adsForSize && adsForSize.length > 0) {
          const ad = adsForSize.shift();
          container.innerHTML = ad.tag;
          console.log(
            `Injected creative for ${ad.adType} pos=${
              ad.position || "N/A"
            } into container #${container.id}`
          );
          const tracker = document.createElement("img");
          tracker.src = ad.trackedImpressionCounter;
          tracker.width = 1;
          tracker.height = 1;
          tracker.style.position = "absolute";
          tracker.style.left = "-9999px";
          document.body.appendChild(tracker);
        } else {
          console.warn(`No creative available for slot size ${baseSlot}`);
        }
      });
    })
    .fail((err) => {
      console.error("Adhese request failed", err);
    });
  }

  loadAdsOnPageLoad() {
    window.addEventListener("load", () => {
      setTimeout(() => this.loadAds(), this.config.insertionDelay);
    });
  }
}

// Configuration
const CONFIG = {
  topBarSelector: ".TopBar",
  verticalSlotSelector: "#MainWrapper > .VerticalSlot",
  interrupterSelector: ".InterrupterCardContainer",
  gapBetweenFloatingDivs: 1360,
  leftOffsetAdjustment: 14,
  insertionDelay: 0,
};

// Initialize the ad injector
new AdInjector(CONFIG);
