# Phase 7 Capacity Budget — code changes

File: src/dashboard-view/dashboard-view.js

Line numbers below refer to the uploaded OLD file and the supplied NEW file.

## Insert after OLD line 170; NEW lines 171–173

OLD:
```javascript
// Insert here; no old code to remove.
```

NEW:
```javascript

  dashboardViewState.screenCapacity.budget =
    estimateDashboardCapacityBudget(main, sections);
```

## OLD lines 255–255; NEW lines 258–266

OLD:
```javascript
      "\n" + recommendation;
```

NEW:
```javascript
      "\n" + recommendation +
      "\nStandalone card budget (Health closed, current section width): " +
      sections.map(function (section) {
        const estimate = measurement.budget[section[0]];
        return section[0].toUpperCase() + ": " +
          (estimate ? estimate.cards : "N/A");
      }).join(" | ") +
      "\nEach estimate assumes that section alone below the title. " +
      "Based on current card sizes and columns; do not add these counts.";
```

## Insert after OLD line 262; NEW lines 274–358

OLD:
```javascript
// Insert here; no old code to remove.
```

NEW:
```javascript
}


function estimateDashboardCapacityBudget(main, sections) {
  const health = getViewElement("healthPanel");
  const wasHidden = health ? health.hidden : true;
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  const budget = {};
  const px = function (value) { return parseFloat(value) || 0; };

  // Read the Health-closed layout synchronously; restore before painting.
  try {
    if (health) health.hidden = true;
    const title = main.querySelector(".hxl-view-dashboard-head");
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const scrollTop = window.scrollY || 0;
    const titleBottom = title
      ? title.getBoundingClientRect().bottom + scrollTop
      : main.getBoundingClientRect().top + scrollTop;
    const bottomPadding = px(window.getComputedStyle(main).paddingBottom);

    sections.forEach(function (section) {
      const container = getViewElement(section[1]);
      const cards = container ? Array.prototype.filter.call(
        container.children, function (card) {
          return card.classList.contains("hxl-view-object") &&
            card.getClientRects().length > 0;
        }
      ) : [];
      if (!cards.length) {
        budget[section[0]] = null;
        return;
      }

      const containerStyles = window.getComputedStyle(container);
      const bounds = cards.map(function (card) {
        return card.getBoundingClientRect();
      });
      const firstTop = Math.min.apply(null, bounds.map(function (b) {
        return b.top;
      }));
      const columns = bounds.filter(function (b) {
        return Math.abs(b.top - firstTop) < 1;
      }).length;
      const maxHeight = Math.max.apply(null, cards.map(function (card, i) {
        const style = window.getComputedStyle(card);
        return bounds[i].height + Math.max(0, px(style.marginTop)) +
          Math.max(0, px(style.marginBottom));
      }));
      const gap = Math.max(0, px(containerStyles.rowGap));
      const wrapper = container.closest(".hxl-view-card");
      const block = wrapper || container;
      const blockStyles = window.getComputedStyle(block);
      const group = block.parentElement;
      const separation = group && group.classList.contains("hxl-view-content-grid")
        ? px(window.getComputedStyle(group).marginTop)
        : px(blockStyles.marginTop);
      const overhead = Math.max(0,
        container.getBoundingClientRect().top - block.getBoundingClientRect().top
      ) + px(blockStyles.paddingBottom) + px(blockStyles.borderBottomWidth);
      const height = Math.max(0,
        viewportHeight - titleBottom - separation - overhead - bottomPadding
      );
      const horizontalFit = bounds.every(function (b) {
        return b.left >= 0 && b.right <= viewportWidth;
      });
      const rows = horizontalFit && maxHeight > 0
        ? Math.max(0, Math.floor((height + gap) / (maxHeight + gap)))
        : 0;
      budget[section[0]] = {
        cards: rows * columns,
        rows: rows,
        columns: columns,
        availableHeight: Math.floor(height)
      };
    });
  } finally {
    if (health) health.hidden = wasHidden;
    if (window.scrollX !== savedScrollX || window.scrollY !== savedScrollY) {
      window.scrollTo(savedScrollX, savedScrollY);
    }
  }
  return budget;
```
