const MATERIALS = [
  {
    name: "Dustite",
    orePrice: 1000,
    gemPrice: 25000
  },
  {
    name: "Void Rift",
    orePrice: 350,
    gemPrice: null
  },
  {
    name: "Gold",
    orePrice: 1500,
    gemPrice: null
  },
  {
    name: "Copite",
    orePrice: 550,
    gemPrice: 27000
  },
  {
    name: "Velorite",
    orePrice: 650,
    gemPrice: 29000
  },
  {
    name: "Crimsite",
    orePrice: 750,
    gemPrice: 31500
  },
  {
    name: "Shalore",
    orePrice: 850,
    gemPrice: 33500
  },
  {
    name: "Noctite",
    orePrice: 950,
    gemPrice: 35500
  },
  {
    name: "Auorite",
    orePrice: 1050,
    gemPrice: 37500
  },
  {
    name: "Vexite",
    orePrice: 1150,
    gemPrice: 39500
  },
  {
    name: "Zephyne",
    orePrice: 1250,
    gemPrice: 41500
  },
  {
    name: "Korunite",
    orePrice: 1350,
    gemPrice: 44000
  },
  {
    name: "Drakonite",
    orePrice: 1450,
    gemPrice: 46000
  },
  {
    name: "Potent Void Rift",
    orePrice: 350,
    gemPrice: null
  },
  {
    name: "Pyrethium",
    orePrice: null,
    gemPrice: 48000
  },
  {
    name: "Infernite",
    orePrice: null,
    gemPrice: 50000
  }
];

const state = {
  cart: [],
  search: ""
};

const list = document.querySelector("#materialList");
const template = document.querySelector("#materialTemplate");
const search = document.querySelector("#search");
const cartItems = document.querySelector("#cartItems");
const grandTotal = document.querySelector("#grandTotal");
const cartCount = document.querySelector("#cartCount");
const validationMessage = document.querySelector("#validationMessage");

const gp = value =>
  value == null
    ? "N/A"
    : `${Number(value).toLocaleString()} GP`;

function renderMaterials() {
  list.innerHTML = "";

  const filtered = MATERIALS.filter(material =>
    material.name
      .toLowerCase()
      .includes(state.search.toLowerCase())
  );

  if (!filtered.length) {
    list.innerHTML =
      `<div class="no-results">No matching materials found.</div>`;
    return;
  }

  filtered.forEach(material => {
    const node = template.content.cloneNode(true);

    const title = node.querySelector("h3");
    const prices = node.querySelector(".prices");
    const buttons = [...node.querySelectorAll(".type-btn")];
    const qty = node.querySelector(".qty-input");
    const lineTotal = node.querySelector(".line-total");
    const add = node.querySelector(".add-btn");

    const oreButton =
      buttons.find(button => button.dataset.type === "ore");

    const gemButton =
      buttons.find(button => button.dataset.type === "gem");

    title.textContent = material.name;

    const oreText =
      material.orePrice == null
        ? "Not Available"
        : gp(material.orePrice);

    const gemText =
      material.gemPrice == null
        ? "No Gem"
        : gp(material.gemPrice);

    prices.innerHTML = `
      Ore <b>${oreText}</b>
      <span class="dot">•</span>
      Uncut Gem <b>${gemText}</b>
    `;

    let selectedType;

    // Disable ore if this material has no ore
    if (material.orePrice == null) {
      oreButton.disabled = true;
      oreButton.classList.remove("active");
    }

    // Disable gem if this material has no gem
    if (material.gemPrice == null) {
      gemButton.disabled = true;
      gemButton.classList.remove("active");
    }

    // Pick the default available option
    if (material.orePrice != null) {
      selectedType = "ore";
      oreButton.classList.add("active");
      gemButton.classList.remove("active");
    } else if (material.gemPrice != null) {
      selectedType = "gem";
      gemButton.classList.add("active");
      oreButton.classList.remove("active");
    }

    function unitPrice() {
      if (selectedType === "ore") {
        return material.orePrice;
      }

      if (selectedType === "gem") {
        return material.gemPrice;
      }

      return null;
    }

    function updateLineTotal() {
      const amount = Math.max(
        1,
        parseInt(qty.value || "1", 10)
      );

      const price = unitPrice();

      if (price == null) {
        lineTotal.textContent = "N/A";
        return;
      }

      lineTotal.textContent = gp(price * amount);
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;

        selectedType = btn.dataset.type;

        buttons.forEach(button => {
          button.classList.toggle(
            "active",
            button === btn
          );
        });

        updateLineTotal();
      });
    });

    qty.addEventListener("input", updateLineTotal);

    add.addEventListener("click", () => {
      const amount = Math.max(
        1,
        parseInt(qty.value || "1", 10)
      );

      const price = unitPrice();

      if (price == null) {
        return;
      }

      // Check if trying to buy a gem without ore in cart
      if (selectedType === "gem") {
        const matchingOreQty = state.cart.reduce(
          (sum, item) =>
            item.type === "ore" && item.name === material.name
              ? sum + item.qty
              : sum,
          0
        );

        if (matchingOreQty === 0) {
          validationMessage.className = "validation-message";
          validationMessage.textContent =
            `⚠ You must add matching ${material.name} ore to your cart before purchasing gems.`;
          return;
        }

        if (matchingOreQty < 6) {
          validationMessage.className = "validation-message";
          validationMessage.textContent =
            `⚠ You need at least 6 ${material.name} ore in your cart before purchasing any gems. You have ${matchingOreQty}.`;
          return;
        }
      }

      state.cart.push({
        id:
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now() + Math.random()),

        name: material.name,
        type: selectedType,
        qty: amount,
        unitPrice: price
      });

      renderCart();

      add.textContent = "Added ✓";

      setTimeout(() => {
        add.textContent = "Add";
      }, 700);
    });

    updateLineTotal();

    list.appendChild(node);
  });
}

function getGemRuleProblems() {
  const totals = {};

  state.cart.forEach(item => {
    totals[item.name] ??= {
      ore: 0,
      gem: 0
    };

    totals[item.name][item.type] += item.qty;
  });

  const problems = [];

  for (const [name, quantities] of Object.entries(totals)) {
    if (
      quantities.gem > 0 &&
      quantities.ore < quantities.gem * 6
    ) {
      const requiredOre = quantities.gem * 6;

      problems.push(
        `${name} needs at least ${requiredOre} matching ore for ${quantities.gem} gem${quantities.gem === 1 ? "" : "s"}.`
      );
    }
  }

  return problems;
}

function renderCart() {
  const count = state.cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  cartCount.textContent =
    `${count} item${count === 1 ? "" : "s"}`;

  if (!state.cart.length) {
    cartItems.innerHTML =
      `<div class="empty-cart">Nothing added yet.</div>`;
  } else {
    cartItems.innerHTML = "";

    state.cart.forEach(item => {
      const row = document.createElement("div");

      row.className = "cart-row";

      const itemLabel =
        item.type === "ore"
          ? "Ore"
          : "Uncut Gem";

      row.innerHTML = `
        <div>
          <div class="cart-name">
            ${item.name} ${itemLabel}
          </div>

          <div class="cart-meta">
            ${item.qty} × ${gp(item.unitPrice)}
          </div>
        </div>

        <div class="cart-price">
          ${gp(item.qty * item.unitPrice)}
        </div>

        <button
          class="remove-btn"
          aria-label="Remove item"
        >
          ×
        </button>
      `;

      row
        .querySelector(".remove-btn")
        .addEventListener("click", () => {
          state.cart = state.cart.filter(
            cartItem => cartItem.id !== item.id
          );

          renderCart();
        });

      cartItems.appendChild(row);
    });
  }

  const total = state.cart.reduce(
    (sum, item) =>
      sum + item.qty * item.unitPrice,
    0
  );

  grandTotal.textContent = gp(total);

  const problems = getGemRuleProblems();

  if (problems.length) {
    validationMessage.className =
      "validation-message";

    validationMessage.textContent =
      "⚠ " + problems[0];
  } else if (
    state.cart.some(item => item.type === "gem")
  ) {
    validationMessage.className =
      "validation-message ok";

    validationMessage.textContent =
      "✓ Minimum 6 matching ore per gem requirement is met.";
  } else {
    validationMessage.className =
      "validation-message";

    validationMessage.textContent = "";
  }

  localStorage.setItem(
    "koruxaOrder",
    JSON.stringify(state.cart)
  );
}

function buildDiscordText() {
  if (!state.cart.length) {
    return "Koruxa Order: (empty)";
  }

  const grouped = {};

  state.cart.forEach(item => {
    const key =
      `${item.name}|${item.type}`;

    grouped[key] ??= {
      ...item,
      qty: 0
    };

    grouped[key].qty += item.qty;
  });

  const lines = [
    "**Koruxa Ore & Gem Order**",
    ""
  ];

  Object.values(grouped).forEach(item => {
    const label =
      item.type === "ore"
        ? "Ore"
        : "Uncut Gem";

    lines.push(
      `• ${item.name} ${label} × ${item.qty} — ${gp(item.qty * item.unitPrice)}`
    );
  });

  lines.push("");

  lines.push(
    `**Total: ${grandTotal.textContent}**`
  );

  lines.push("");

  lines.push(
    "_Gem rule: 1 uncut gem requires 6 matching ore._"
  );

  const problems = getGemRuleProblems();

  if (problems.length) {
    lines.push("");

    lines.push(
      "⚠ Order does not currently meet the minimum matching-ore requirement."
    );
  }

  return lines.join("\n");
}

search.addEventListener("input", event => {
  state.search = event.target.value;

  renderMaterials();
});

document
  .querySelector("#clearOrder")
  .addEventListener("click", () => {
    state.cart = [];

    renderCart();
  });

document
  .querySelector("#copyOrder")
  .addEventListener("click", async event => {
    const text = buildDiscordText();

    try {
      await navigator.clipboard.writeText(text);

      event.currentTarget.textContent =
        "Copied ✓";
    } catch {
      window.prompt(
        "Copy your order:",
        text
      );

      event.currentTarget.textContent =
        "Copy Order for Discord";

      return;
    }

    setTimeout(() => {
      event.currentTarget.textContent =
        "Copy Order for Discord";
    }, 1000);
  });

try {
  const saved = JSON.parse(
    localStorage.getItem("koruxaOrder") || "[]"
  );

  if (Array.isArray(saved)) {
    // Remove any old invalid items from saved orders
    state.cart = saved.filter(item => {
      const material = MATERIALS.find(
        material => material.name === item.name
      );

      if (!material) {
        return false;
      }

      if (
        item.type === "ore" &&
        material.orePrice == null
      ) {
        return false;
      }

      if (
        item.type === "gem" &&
        material.gemPrice == null
      ) {
        return false;
      }

      // Update saved items to current prices
      item.unitPrice =
        item.type === "ore"
          ? material.orePrice
          : material.gemPrice;

      return true;
    });
  }
} catch {
  state.cart = [];
}

renderMaterials();
renderCart();
