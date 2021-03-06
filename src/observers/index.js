if (!window.__UPGRADED_ELEMENT__DIR_OBSERVER__) {
  window.__UPGRADED_ELEMENT__DIR_OBSERVER__ = true

  /**
   * Search for other rotom elements, denoted by the
   * presence of `rotom-id` on the element, and update
   * its document direction.
   * @param {HTMLElement|ShadowRoot} context
   */
  const updateDirection = (context = document) => {
    const nodes = context.querySelectorAll("[rotom-id]")
    if (!nodes.length) return

    nodes.forEach((node) => {
      node.setAttribute("dir", String(document.dir || "ltr"))

      if (node.shadowRoot) {
        updateDirection(node.shadowRoot)
      }
    })
  }

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "dir") {
        updateDirection()
      }
    })
  })

  mutationObserver.observe(document.documentElement, { attributes: true })
}
