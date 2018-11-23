import { disableTabFocus } from "./disableTabFocus";

const events = ["keypress", "keydown", "click", "mousedown", "mouseup"];

let currentEl = null;

function isChildren(el2) {
  if (currentEl == el2) return true;
  while (el2 && el2 != el2.parentNode) {
    el2 = el2.parentNode;
    if (currentEl == el2) return true;
  }
  return false;
}

function stop(e) {
  if (
    !e.target ||
    e.target == document.body ||
    e.target == document.documentElement ||
    isChildren(e.target) ||
    e.key == "Tab"
  )
    return;
  e.stopPropagation();
  e.preventDefault();
}

function stopFocus(e) {
  if (e.target && !isChildren(e.target)) {
    e.blur();
  }
}

function startListeners() {
  events.forEach(type => document.body.addEventListener(type, stop, false));
  document.body.addEventListener("focus", stopFocus, false);
}

function stopListeners() {
  events.forEach(type => document.body.removeEventListener(type, stop, false));
  document.body.removeEventListener("focus", stopFocus, false);
}

let locks = [];
export function lock(el) {
  if (locks.length == 0) startListeners();
  locks.push(el);
  currentEl = el;
  const stopFixTabIndex = disableTabFocus(el2 => !isChildren(el2));
  return () => {
    stopFixTabIndex();
    locks = locks.filter(el2 => el2 != el);
    if (locks.length == 0) {
      stopListeners();
      currentEl = null;
    } else {
      currentEl = locks[locks.length - 1];
    }
  };
}
