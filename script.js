// =====================================================
// KORUXA ORE & GEM MARKET
// 1 Uncut Gem requires 6 matching Ore
// =====================================================

const ORE_PER_GEM = 6;

const MATERIALS = [
  { name: "Dustite", orePrice: 1000, gemPrice: 25000 },
  { name: "Void Rift", orePrice: 350, gemPrice: null },
  { name: "Gold", orePrice: 1500, gemPrice: null },
  { name: "Copite", orePrice: 550, gemPrice: 27000 },
  { name: "Velorite", orePrice: 650, gemPrice: 29000 },
  { name: "Crimsite", orePrice: 750, gemPrice: 31500 },
  { name: "Shalore", orePrice: 850, gemPrice: 33500 },
  { name: "Noctite", orePrice: 950, gemPrice: 35500 },
  { name: "Auorite", orePrice: 1050, gemPrice: 37500 },
  { name: "Vexite", orePrice: 1150, gemPrice: 39500 },
  { name: "Zephyne", orePrice: 1250, gemPrice: 41500 },
  { name: "Korunite", orePrice: 1350, gemPrice: 44000 },
  { name: "Drakonite", orePrice: 1450, gemPrice: 46000 },
  { name: "Potent Void Rift", orePrice: 350, gemPrice: null },
  { name: "Pyrethium", orePrice: 1550, gemPrice: 48000 },
  { name: "Infernite", orePrice: 1650, gemPrice: 50000 }
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

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

function getCartQuantity(materialName, type) {
  return state.cart
    .filter(
      item =>
        item.name === materialName &&
        item.type === type
    )
    .reduce((total, item) => total + item.qty, 0);
}

function getMaximumGems(materialName) {
  const oreQty = getCartQuantity(materialName, "ore");

  return Math.floor(oreQty / ORE_PER_GEM);
}

function getRemainingGemAllowance(materialName) {
  const maxGems = getMaximumGems(materialName);
  const currentGems = getCartQuantity(materialName, "gem");

  return Math.max(0, maxGems - currentGems);
}


// =====================================================
// ENFORCE GEM RULE
// =====================================================

function enforceGemRules() {
  MATERIALS.forEach(material => {
    const oreQty = getCartQuantity(material.name, "ore");
    const allowedGems = Math.floor(oreQty / ORE_PER_GEM);

    let gemsSeen = 0;

    state.cart = state.cart.filter(item => {
      if (
        item.name !== material.name ||
        item.type !== "gem"
      ) {
        return true;
      }

      const remainingAllowed = allowedGems - gemsSeen;

      if (remainingAllowed <= 0) {
        return false;
      }

      if (item.qty > remainingAllowed) {
        item.qty = remainingAllowed;
      }

      gemsSeen += item.qty;

      return item.qty > 0;
    });
  });
}


// =====================================================
// MATERIAL LIST
// =====================================================

function renderMaterials() {
  list.innerHTML = "";

  const filtered = MATERIALS.filter(material =>
    material.name
      .toLowerCase()
      .includes(state.search.toLowerCase())
  );

  if (!filtered.length) {
    list.innerHTML = `
      <div class="no-results">
        No matching materials found.
      </div>
    `;
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

    const oreButton = buttons.find(
      button => button.dataset.type === "ore"
    );

    const gemButton = buttons.find(
      button => button.dataset.type === "gem"
    );

    title.textContent = material.name;

    prices.innerHTML = `
      Ore <b>${gp(material.orePrice)}</b>
      <span class="dot">•</span>
      Uncut Gem <b>${gp(material.gemPrice)}</b>
    `;

    let selectedType =
      material.orePrice != null
        ? "ore"
        : "gem";


    // ---------------------------------------------
    // DISABLE UNAVAILABLE TYPES
    // ---------------------------------------------

    if (material.orePrice == null) {
      oreButton.disabled = true;
      oreButton.classList.remove("active");
    }

    if (material.gemPrice == null) {
      gemButton.disabled = true;
      gemButton.classList.remove("active");
    }

    if (material.orePrice != null) {
      selectedType = "ore";
      oreButton.classList.add("active");
      gemButton.classList.remove("active");
    } else if (material.gemPrice != null) {
      selectedType = "gem";
      gemButton.classList.add("active");
    }


    function unitPrice() {
      return selectedType === "ore"
        ? material.orePrice
        : material.gemPrice;
    }


    // =================================================
    // QUANTITY LIMIT
    // =================================================

    function updateQuantityLimits() {
      if (selectedType === "gem") {
        const remainingAllowed =
          getRemainingGemAllowance(material.name);

        qty.min = "1";
        qty.max = String(
          Math.max(1, remainingAllowed)
        );

        if (remainingAllowed <= 0) {
          qty.value = "1";
          qty.disabled = true;
          add.disabled = true;

          add.textContent =
            `Need ${ORE_PER_GEM} Ore`;
        } else {
          qty.disabled = false;
          add.disabled = false;

          let currentValue =
            parseInt(qty.value || "1", 10);

          if (currentValue > remainingAllowed) {
            currentValue = remainingAllowed;
          }

          if (currentValue < 1) {
            currentValue = 1;
          }

          qty.value =
            String(currentValue);

          add.textContent = "Add";
        }
      } else {
        qty.min = "1";
        qty.removeAttribute("max");
        qty.disabled = false;
        add.disabled = false;
        add.textContent = "Add";
      }
    }


    function updateLineTotal() {
      let amount =
        Math.max(
          1,
          parseInt(qty.value || "1", 10)
        );

      if (selectedType === "gem") {
        const maxAllowed =
          getRemainingGemAllowance(material.name);

        if (maxAllowed > 0) {
          amount = Math.min(
            amount,
            maxAllowed
          );

          qty.value =
            String(amount);
        }
      }

      const price = unitPrice();

      lineTotal.textContent =
        price == null
          ? "N/A"
          : gp(price * amount);
    }


    // =================================================
    // TYPE BUTTONS
    // =================================================

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        if (button.disabled) return;

        selectedType =
          button.dataset.type;

        buttons.forEach(btn => {
          btn.classList.toggle(
            "active",
            btn === button
          );
        });

        updateQuantityLimits();
        updateLineTotal();
      });
    });


    // =================================================
    // QUANTITY INPUT
    // =================================================

    qty.addEventListener("input", () => {
      let amount =
        parseInt(qty.value || "1", 10);

      if (!Number.isFinite(amount)) {
        amount = 1;
      }

      if (selectedType === "gem") {
        const maxAllowed =
          getRemainingGemAllowance(material.name);

        if (maxAllowed <= 0) {
          qty.value = "1";
          return;
        }

        if (amount > maxAllowed) {
          amount = maxAllowed;
        }

        if (amount < 1) {
          amount = 1;
        }

        qty.value =
          String(amount);
      } else {
        if (amount < 1) {
          amount = 1;
        }

        qty.value =
          String(amount);
      }

      updateLineTotal();
    });


    qty.addEventListener("change", () => {
      let amount =
        parseInt(qty.value || "1", 10);

      if (selectedType === "gem") {
        const maxAllowed =
          getRemainingGemAllowance(material.name);

        if (maxAllowed > 0) {
          amount = Math.min(
            Math.max(amount, 1),
            maxAllowed
          );
        }
      } else {
        amount =
          Math.max(amount, 1);
      }

      qty.value =
        String(amount);

      updateLineTotal();
    });


    // =================================================
    // ADD TO CART
    // =================================================

    add.addEventListener("click", () => {
      if (add.disabled) {
        return;
      }

      let amount =
        Math.max(
          1,
          parseInt(qty.value || "1", 10)
        );

      const price =
        unitPrice();

      if (price == null) {
        alert(
          "This item is currently unavailable."
        );

        return;
      }


      // ---------------------------------------------
      // GEM MAX CHECK
      // ---------------------------------------------

      if (selectedType === "gem") {
        const remainingAllowed =
          getRemainingGemAllowance(material.name);

        if (remainingAllowed <= 0) {
          alert(
            `You need ${ORE_PER_GEM} ${material.name} Ore for every 1 gem.`
          );

          return;
        }

        amount =
          Math.min(
            amount,
            remainingAllowed
          );

        qty.value =
          String(amount);
      }


      state.cart.push({
        id: createId(),
        name: material.name,
        type: selectedType,
        qty: amount,
        unitPrice: price
      });

      enforceGemRules();

      renderCart();
      renderMaterials();
    });


    updateQuantityLimits();
    updateLineTotal();

    list.appendChild(node);
  });
}


// =====================================================
// VALIDATION
// =====================================================

function getGemRuleProblems() {
  const problems = [];

  MATERIALS.forEach(material => {
    const oreQty =
      getCartQuantity(
        material.name,
        "ore"
      );

    const gemQty =
      getCartQuantity(
        material.name,
        "gem"
      );

    const requiredOre =
      gemQty * ORE_PER_GEM;

    if (
      gemQty > 0 &&
      oreQty < requiredOre
    ) {
      problems.push(
        `${material.name} needs ${requiredOre} matching ore for ${gemQty} gem${gemQty === 1 ? "" : "s"}.`
      );
    }
  });

  return problems;
}


// =====================================================
// CART
// =====================================================

function renderCart() {
  enforceGemRules();

  const count =
    state.cart.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );

  cartCount.textContent =
    `${count} item${count === 1 ? "" : "s"}`;

  if (!state.cart.length) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        Nothing added yet.
      </div>
    `;
  } else {
    cartItems.innerHTML = "";

    state.cart.forEach(item => {
      const row =
        document.createElement("div");

      row.className =
        "cart-row";

      row.innerHTML = `
        <div>
          <div class="cart-name">
            ${item.name}
            ${item.type === "ore" ? "Ore" : "Uncut Gem"}
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
          const removingOre =
            item.type === "ore";

          const materialName =
            item.name;

          const gemsBefore =
            getCartQuantity(
              materialName,
              "gem"
            );

          state.cart =
            state.cart.filter(
              cartItem =>
                cartItem.id !== item.id
            );

          if (removingOre) {
            enforceGemRules();

            const gemsAfter =
              getCartQuantity(
                materialName,
                "gem"
              );

            const removedGems =
              gemsBefore - gemsAfter;

            if (removedGems > 0) {
              alert(
                `${removedGems} ${materialName} Gem${removedGems === 1 ? "" : "s"} were removed because you no longer have enough ore.\n\nYou need ${ORE_PER_GEM} ore per gem.`
              );
            }
          }

          renderCart();
          renderMaterials();
        });

      cartItems.appendChild(row);
    });
  }


  const total =
    state.cart.reduce(
      (sum, item) =>
        sum +
        item.qty *
        item.unitPrice,
      0
    );

  grandTotal.textContent =
    gp(total);


  const problems =
    getGemRuleProblems();

  if (problems.length) {
    validationMessage.className =
      "validation-message";

    validationMessage.textContent =
      "⚠ " + problems[0];

  } else if (
    state.cart.some(
      item => item.type === "gem"
    )
  ) {
    validationMessage.className =
      "validation-message ok";

    validationMessage.textContent =
      `✓ Gem requirement met: ${ORE_PER_GEM} matching ore per gem.`;

  } else {
    validationMessage.className =
      "validation-message";

    validationMessage.textContent =
      "";
  }


  localStorage.setItem(
    "koruxaOrder",
    JSON.stringify(state.cart)
  );
}


// =====================================================
// DISCORD ORDER
// =====================================================

function buildDiscordText() {
  if (!state.cart.length) {
    return "Koruxa Order: (empty)";
  }

  const grouped = {};

  state.cart.forEach(item => {
    const key =
      `${item.name}|${item.type}`;

    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        qty: 0
      };
    }

    grouped[key].qty +=
      item.qty;
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
    `_Gem rule: 1 uncut gem requires ${ORE_PER_GEM} matching ore._`
  );

  return lines.join("\n");
}


// =====================================================
// SEARCH
// =====================================================

search.addEventListener(
  "input",
  event => {
    state.search =
      event.target.value;

    renderMaterials();
  }
);


// =====================================================
// CLEAR ORDER
// =====================================================

document
  .querySelector("#clearOrder")
  .addEventListener(
    "click",
    () => {
      state.cart = [];

      renderCart();
      renderMaterials();
    }
  );


// =====================================================
// COPY ORDER
// =====================================================

document
  .querySelector("#copyOrder")
  .addEventListener(
    "click",
    async event => {
      enforceGemRules();
      renderCart();

      const text =
        buildDiscordText();

      try {
        await navigator.clipboard.writeText(
          text
        );

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
    }
  );


// =====================================================
// LOAD SAVED CART
// =====================================================

try {
  const saved =
    JSON.parse(
      localStorage.getItem(
        "koruxaOrder"
      ) || "[]"
    );

  if (Array.isArray(saved)) {
    state.cart = saved;
  }

} catch {
  state.cart = [];
}

enforceGemRules();

renderMaterials();
renderCart();
