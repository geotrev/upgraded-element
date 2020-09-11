import { UpgradedElement, register } from "../../src"

export class KitchenSinkTest extends UpgradedElement {
  static get properties() {
    return {
      firstName: {
        type: "string",
        default: (element) => element.getAttribute("first-name"),
        reflected: true,
      },
      dataAttr: {
        type: "string",
        default: (element) =>
          `data-removes='${element.getAttribute("first-name")}'`,
      },
      highlight: {
        type: "string",
        default: "color: white; background-color: blue",
      },
      changeCount: {
        type: "number",
        default: 0,
      },
    }
  }

  static get styles() {
    return `:host { display: block; } .compliments { font-weight: bold; }`
  }

  constructor() {
    super()
    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleRemoveHL = this.handleRemoveHL.bind(this)
    this.handleRemoveAttr = this.handleRemoveAttr.bind(this)
  }

  elementDidMount() {
    this.changeNameButton = this.shadowRoot.querySelector("#update-name-btn")
    this.removeHighlightsButton = this.shadowRoot.querySelector(
      "#update-hl-btn"
    )
    this.removeAttributeButton = this.shadowRoot.querySelector(
      "#update-attr-btn"
    )
    this.changeNameButton.addEventListener("click", this.handleNameChange)
    this.removeHighlightsButton.addEventListener("click", this.handleRemoveHL)
    this.removeAttributeButton.addEventListener("click", this.handleRemoveAttr)
  }

  elementWillUnmount() {
    this.changeNameButton.removeEventListener("click", this.handleNameChange)
    this.removeHighlightsButton.removeEventListener(
      "click",
      this.handleRemoveHL
    )
    this.removeAttributeButton.removeEventListener(
      "click",
      this.handleRemoveAttr
    )
  }

  render() {
    return `
      <div>
        <p style="${this.highlight}">
          You've changed names ${this.changeCount} times
        </p>
        <p class="compliments" ${this.dataAttr} data-empty="${
      this.dataAttr
    }">You're awesome, ${this.firstName}!</p>
        <p>${this.getAttribute("description")}</p>
        ${this.dataAttr === "" ? "<div>Removed attribute</div>" : ""}
        <button id="update-name-btn">Change Name</button>
        <button id="update-hl-btn">Remove Highlights</button>
        <button id="update-attr-btn">Remove Attribute</button>
        <slot></slot>
      </div>
    `
  }

  getNewName() {
    const newName = this.getRandom([
      "Sonic",
      "Knuckles",
      "Tails",
      "Eggman",
      "Shadow",
    ])
    if (newName === this.firstName) return this.getNewName()
    return newName
  }

  handleNameChange() {
    this.changeCount = this.changeCount + 1
    const newName = this.getNewName()
    const [text, bg] = this.getHighlight()

    this.dataAttr = `data-removes='${newName}'`
    this.highlight = `color: ${text}; background-color: ${bg}`
    this.firstName = newName
  }

  handleRemoveHL() {
    if (!this.highlight) return
    this.highlight = ""
  }

  handleRemoveAttr() {
    if (!this.dataAttr) return
    this.dataAttr = ""
  }

  getRandom(items) {
    return items[Math.floor(Math.random() * items.length)]
  }

  getHighlight() {
    const bg = this.getRandom([
      "darkorange",
      "blue",
      "darkblue",
      "green",
      "purple",
    ])
    const text = this.getRandom(["skyblue", "lime", "white"])
    return [text, bg]
  }
}

register("kitchen-sink-test", KitchenSinkTest)