import { createScheduler } from "./scheduler"
import { upgradeProperty } from "./properties"
import { Internal, External, Attributes, AttributeValues } from "./enums"
import {
  isEmptyObject,
  isString,
  isFunction,
  getTypeTag,
  toKebabCase,
  createUUID,
  log,
} from "./utilities"

const SHADOW_ROOT_MODE = "open"

export function rotomFactory(renderer) {
  /**
   * @module Rotom
   * @extends HTMLElement
   */
  return class Rotom extends HTMLElement {
    constructor() {
      super()

      // Internal methods, properties, and data
      this[Internal.schedule] = createScheduler()
      this[Internal.renderer] = renderer({ Internal, External })

      this.attachShadow({ mode: SHADOW_ROOT_MODE })

      this[Internal.patch] = this[Internal.patch].bind(this)
      this[Internal.isFirstRender] = true
      this[Internal.vDOM] = null
      this[Internal.rotomId] = createUUID()
    }

    // Retrieve defined properties from the constructor.
    static get observedAttributes() {
      const properties = this[External.staticProperties]

      if (isEmptyObject(properties)) return []

      let attributes = []
      for (let propName in properties) {
        if (!properties[propName].reflected) continue
        attributes.push(toKebabCase(propName))
      }
      return attributes
    }

    // Keep adoptedCallback around in case it becomes useful later.
    // Consumers will need to call super() to remain compatible,
    // in the mean time.
    adoptedCallback() {}

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this[Internal.runPossibleConstructorMethod](
          External.elementAttributeChanged,
          name,
          oldValue,
          newValue
        )
      }
    }

    connectedCallback() {
      // It's possible for elements to queue this callback
      // and then disconnect before resolving. This ensures
      // the element is actually connected before proceeding.
      if (!this.isConnected) return

      this[Internal.upgrade]()
      this[Internal.runPossibleConstructorMethod](External.elementDidConnect)
      this[Internal.renderStyles]()
      this[External.requestRender]()
    }

    disconnectedCallback() {
      this[Internal.runPossibleConstructorMethod](External.elementWillUnmount)
      this[Internal.destroy]()
    }

    // Public

    /**
     * Returns the Internal element id.
     * @returns {string}
     */
    get [External.rotomIdProperty]() {
      return this[Internal.rotomId]
    }

    /**
     * Requests a new render.
     */
    [External.requestRender]() {
      this[Internal.schedule](this[Internal.patch])
    }

    /**
     * Validates a property's value.
     * @param {string} propName
     * @param {string} value
     * @param {string} type
     */
    [External.validateType](propName, value, type) {
      const evaluatedType = getTypeTag(value)
      if (type === undefined || evaluatedType === type) return

      // TODO: this should probably only be bundled in a '.dev.js' bundle
      log(
        `Property '${propName}' is invalid type of '${evaluatedType}'. Expected '${type}'. Check ${this.constructor.name}.`
      )
    }

    // Private

    /**
     * If the method is defined by the constructor, run it.
     * @param {string} methodName - name of the possible method
     * @param {arguments} args - args to pass along to the method, if any
     */
    [Internal.runPossibleConstructorMethod](methodName, ...args) {
      if (isFunction(this[methodName])) {
        this[methodName](...args)
      }
    }

    [Internal.upgrade]() {
      // Set element id prop as an attribute
      this.setAttribute(
        External.rotomIdAttribute,
        this[External.rotomIdProperty]
      )

      // Set document direction for reflow support in shadow roots
      this.setAttribute(
        Attributes.dir,
        String(document.dir || AttributeValues.ltr)
      )

      // Upgrade stateful properties
      this[Internal.upgradeProperties]()
    }

    /**
     * Upgrade properties detected in the constructor.
     */
    [Internal.upgradeProperties]() {
      const properties = this.constructor[External.staticProperties]

      if (isEmptyObject(properties)) return

      for (let propName in properties) {
        upgradeProperty(this, propName, properties[propName])
      }
    }

    /**
     * Called during disconnectedCallback. Clean up the vDOM
     * and remove remaining nodes in the shadowRoot.
     */
    [Internal.destroy]() {
      this[Internal.renderer].destroy(this)
    }

    /**
     * Called during renderDOM. Runs reconciliation and updates
     * the DOM with the new render state
     */
    [Internal.patch]() {
      this[Internal.renderer].patch(this)
    }

    /**
     * Creates the style tag and appends styles as detected in the constructor.
     */
    [Internal.renderStyles]() {
      const styles = this.constructor[External.staticStyles]

      if (!isString(styles)) return

      const styleTag = document.createElement("style")
      styleTag.type = "text/css"
      styleTag.textContent = styles
      this.shadowRoot.appendChild(styleTag)
    }
  }
}
