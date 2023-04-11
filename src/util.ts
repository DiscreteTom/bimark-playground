export function highlight(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("highlight");
  }
}
