if ((window as any).destoryGlobalListeners) {
    (window as any).destoryGlobalListeners();
}
(window as any).globalListenersStarted = true;
const listener = (e: any) => {
    const el = e.target;
    if (
        el instanceof HTMLElement &&
        !(el.tagName in { INPUT: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1 })
    ) {
        const el2 = el.closest("[tabindex]");
        if (el2 && el2.getAttribute("tabindex") != "-1") {
            (el2 as any).focus();
        } else if (
            document.activeElement &&
            !(document.activeElement.tagName in { HTML: 1, BODY: 1 })
        ) {
            const el = document.activeElement;
            if (el && (el as any).blur) (el as any).blur();
        }
        e.preventDefault();
    }
};
window.addEventListener("mousedown", listener);
(window as any).destoryGlobalListeners = () => {
    window.removeEventListener("mousedown", listener);
};
