/***************************************************************
 * Inject Adhese script first, then init and run everything else
 ***************************************************************/
function loadExternalScript(src) {
  return new Promise(function (resolve, reject) {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// 1) Load Adhese script // Using Gerald's CDN
loadExternalScript(
  "https://cdn.jsdelivr.net/gh/geralders/geralderstest@main/adhese_tag.js"
)
  .then(() => {
    console.log("Adhese script loaded");

    /***************************************************************
     * CONFIGURATION SECTION
     * Edit this section only when reusing on another site.
     ***************************************************************/
    const CONFIG = {
      topBarSelector: ".TopBar", // Target for 728x90
      verticalSlotSelector: "#MainWrapper > .VerticalSlot", // Target for 970x250
      interrupterSelector: ".InterrupterCardContainer", // Target for 300x250
      gapBetweenFloatingDivs: 1360, // Gap between 160x600 and 300x600 (inner edges)
      leftOffsetAdjustment: 14, // Move left floating div further left
      insertionDelay: 0, // Delay before insertion (in ms)
    };

    /***************************************************************
     * HELPER FUNCTIONS
     ***************************************************************/

    // Generic ad div creator
    function createStyledDiv(
      id,
      width,
      height,
      parentSelector,
      text,
      clearFirstChild = false
    ) {
      const parent = document.querySelector(parentSelector);
      if (parent) {
        if (clearFirstChild && parent.firstElementChild) {
          parent.removeChild(parent.firstElementChild); // safer than firstChild
        }

        const newDiv = document.createElement("div");
        newDiv.id = id;
        newDiv.classList.add("ad_tag"); // loader queries .ad_tag
        newDiv.textContent = text;

        // Inline styles
        Object.assign(newDiv.style, {
          width: width + "px",
          height: height + "px",
          // border: '1px solid #000',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f8f8",
          margin: "auto",
        });

        // Style parent container for centering
        Object.assign(parent.style, {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "auto",
        });

        parent.appendChild(newDiv);
      } else {
        console.error(`No element found matching "${parentSelector}".`);
      }
    }

    // Floating divs creator (left and right)
    function createFloatingDivs(gap, leftAdjust = 0) {
      const leftDiv = document.createElement("div");
      leftDiv.id = "160x600";
      leftDiv.classList.add("ad_tag"); // match the loader
      leftDiv.textContent = "Left 160x600";
      Object.assign(leftDiv.style, {
        width: "160px",
        height: "600px",
        // border: '1px solid #000',
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
      rightDiv.classList.add("ad_tag"); // match the loader
      rightDiv.textContent = "Right 300x600";
      Object.assign(rightDiv.style, {
        width: "300px",
        height: "600px",
        // border: '1px solid #000',
        backgroundColor: "#f8f8f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: "50%",
        transform: "translateY(-50%)",
      });
      document.body.appendChild(rightDiv);

      // Position floating divs with defined gap and offset
      function positionDivs() {
        const center = window.innerWidth / 2;
        const leftWidth = 160;

        const leftInnerEdge = center - gap / 2;
        const rightInnerEdge = center + gap / 2;

        leftDiv.style.left = leftInnerEdge - leftWidth - leftAdjust + "px";
        rightDiv.style.left = rightInnerEdge + "px";
      }

      positionDivs();
      window.addEventListener("resize", positionDivs);
    }

    /***************************************************************
     * ADHESE INIT (after script load)
     ***************************************************************/
    function getLocation() {
      return "_demopage__one_";
    }

    const vSetting = {
      settings: {
        inViewPercentage: "0.5",
        duration: 5,
      },
    };

    // Create one Adhese instance and keep it globally accessible
    window._adhese = new Adhese();
    window._adhese.init({
      debug: true,
      account: "uncommonmedia",
      type: "staging",
      location: getLocation,
      safeframe: false,
      viewabilityTracking: false || vSetting,
      findDomSlotsOnLoad: false,
    });

    /***************************************************************
     * REQUEST + INJECT ADS
     ***************************************************************/
    function loadAds() {
      if (!window._adhese || !window.AdheseAjax) {
        console.error("Adhese library not ready");
        return;
      }

      const elements = document.querySelectorAll(".ad_tag");
      const adArr = [];

      // Normalize IDs (make them unique but keep base slot)
      const slotIndex = {};
      elements.forEach((el) => {
        const baseSlot = el.getAttribute("id");
        slotIndex[baseSlot] = (slotIndex[baseSlot] || 0) + 1;
        const uniqueId = baseSlot + "_" + slotIndex[baseSlot];
        el.setAttribute("id", uniqueId); // unique DOM id
        el.dataset.baseSlot = baseSlot; // store original slot type
      });

      // Count by slot type
      const slotCount = {};
      elements.forEach((el) => {
        const baseSlot = el.dataset.baseSlot;
        slotCount[baseSlot] = (slotCount[baseSlot] || 0) + 1;
      });

      // Track positions per slotId
      const positionTracker = {};

      elements.forEach((el) => {
        const baseSlot = el.dataset.baseSlot;

        if (slotCount[baseSlot] > 1) {
          if (positionTracker[baseSlot] === undefined)
            positionTracker[baseSlot] = 1;
          const pos = positionTracker[baseSlot]++;
          const options = { write: false, position: pos };
          const tag = window._adhese.tag(baseSlot, options);
          adArr.push(tag);
          console.log(`Requesting slot ${baseSlot} with position ${pos}`);
        } else {
          const tag = window._adhese.tag(baseSlot, { write: false });
          adArr.push(tag);
          console.log(`Requesting slot ${baseSlot} without pos`);
        }
      });

      // Optional targeting
      window._adhese.registerRequestParameter("br", "elektronik");

      // Build request URI
      const adUri = window._adhese.getMultipleRequestUri(adArr, {
        type: "json",
      });
      console.log("Ad request URI:", adUri);

      // Fetch and inject
      AdheseAjax.request({
        url: adUri,
        method: "get",
        json: true,
      }).done(function (result) {
        console.log("Adhese response:", result);

        // group by adType
        const adMap = {};
        result.forEach(function (ad) {
          const size = ad.adType;
          if (!adMap[size]) adMap[size] = [];
          adMap[size].push(ad);
        });

        // inject creatives
        elements.forEach(function (container) {
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

            // tracker
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
      });
    }

    /***************************************************************
     * MAIN EXECUTION
     ***************************************************************/
    // Create DOM slots after a delay
    setTimeout(() => {
      // createStyledDiv('728x90', 728, 90, CONFIG.topBarSelector, 'Centered 728x90 Box');
      createStyledDiv(
        "970x250",
        970,
        250,
        CONFIG.verticalSlotSelector,
        "Centered 970x250 Box"
      );
      createStyledDiv(
        "300x250",
        300,
        250,
        CONFIG.interrupterSelector,
        "Centered 300x250 Box",
        true
      );
      createFloatingDivs(
        CONFIG.gapBetweenFloatingDivs,
        CONFIG.leftOffsetAdjustment
      );
    }, CONFIG.insertionDelay);

    // Request ads after window load to ensure DOM slots exist
    window.addEventListener("load", function () {
      setTimeout(loadAds, CONFIG.insertionDelay);
    });
  })
  .catch((err) => {
    console.error("Failed to load Adhese script", err);
  });
