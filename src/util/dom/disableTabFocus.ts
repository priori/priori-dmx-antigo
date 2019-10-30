const focusableSelector =
  'a:not([tabindex="-1"]):not([disabled]), button:not([tabindex="-1"]):not([disabled]), ' +
  'input:not([tabindex="-1"]):not([disabled]), textarea:not([tabindex="-1"]):not([disabled]), ' +
  'select:not([tabindex="-1"]):not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';

export function disableTabFocus(matcher: ((v: any) => boolean) | HTMLElement) {
  let all: Element[];
  if (typeof matcher == "function") {
    all = [...document.querySelectorAll(focusableSelector)];
    all = [...all].filter(el2 => matcher(el2));
  } else {
    all = [...matcher.querySelectorAll(focusableSelector)];
  }
  all.forEach(el => {
    const el2 = el as any;
    if (!el2._lockCount) {
      el2._tabIndex = el2.getAttribute("tabIndex");
      el2._lockCount = 1;
      el2.setAttribute("tabIndex", "-1");
    } else {
      el2._lockCount++;
    }
  });
  return () => {
    all.forEach(el => {
      const el2 = el as any;
      el2._lockCount--;
      if (!el2._lockCount) {
        const tabIndex = el2._tabIndex;
        delete el2._tabIndex;
        delete el2._lockCount;
        if (tabIndex === null) el2.removeAttribute("tabIndex");
        else el2.setAttribute("tabIndex", tabIndex);
      }
    });
  };
}
