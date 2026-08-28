const MATERIALS = [
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

const gp = value => value == null ? "N/A" : `${Number(value).toLocaleString()} GP`;

function renderMaterials() {
  list.innerHTML = "";
  const filtered = MATERIALS.filter(m =>
    m.name.toLowerCase().includes(state.search.toLowerCase())
  );

  if (!filtered.length) {
    list.innerHTML = `<div class="no-results">No matching materials found.</div>`;
    return;
  }

  filtered.forEach(material => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".material-card");
    const title = node.querySelector("h3");
    const prices = node.querySelector(".prices");
    const buttons = [...node.querySelectorAll(".type-btn")];
    const qty = node.querySelector(".qty-input");
    const lineTotal = node.querySelector(".line-total");
    const add = node.querySelector(".add-btn");

    title.textContent = material.name;
    prices.innerHTML =
      `Ore <b>${gp(material.orePrice)}</b><span class="dot">•</span>Uncut Gem <b>${gp(material.gemPrice)}</b>`;

    let selectedType = material.orePrice == null ? "gem" : "ore";

    if (material.orePrice == null) {
      buttons.find(b => b.dataset.type === "ore").disabled = true;
      buttons.find(b => b.dataset.type === "ore").classList.remove("active");
      buttons.find(b => b.dataset.type === "gem").classList.add("active");
    }

    function unitPrice() {
      return selectedType === "ore" ? material.orePrice : material.gemPrice;
    }

    function updateLineTotal() {
      const amount = Math.max(1, parseInt(qty.value || "1", 10));
      lineTotal.textContent = gp(unitPrice() * amount);
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        selectedType = btn.dataset.type;
        buttons.forEach(b => b.classList.toggle("active", b === btn));
        updateLineTotal();
      });
    });

    qty.addEventListener("input", updateLineTotal);

    add.addEventListener("click", () => {
      const amount = Math.max(1, parseInt(qty.value || "1", 10));
      state.cart.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        name: material.name,
        type: selectedType,
        qty: amount,
        unitPrice: unitPrice()
      });
      renderCart();
      add.textContent = "Added ✓";
      setTimeout(() => add.textContent = "Add", 700);
    });

    updateLineTotal();
    list.appendChild(node);
  });
}

function getGemRuleProblems() {
  const totals = {};

  state.cart.forEach(item => {
    totals[item.name] ??= { ore: 0, gem: 0 };
    totals[item.name][item.type] += item.qty;
  });

  const problems = [];
  for (const [name, q] of Object.entries(totals)) {
    if (q.gem > 0 && q.ore < q.gem * 3) {
      problems.push(`${name} needs at least ${q.gem * 3} matching ore for ${q.gem} gem${q.gem === 1 ? "" : "s"}.`);
    }
  }
  return problems;
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = `${count} item${count === 1 ? "" : "s"}`;

  if (!state.cart.length) {
    cartItems.innerHTML = `<div class="empty-cart">Nothing added yet.</div>`;
  } else {
    cartItems.innerHTML = "";
    state.cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div>
          <div class="cart-name">${item.name} ${item.type === "ore" ? "Ore" : "Uncut Gem"}</div>
          <div class="cart-meta">${item.qty} × ${gp(item.unitPrice)}</div>
        </div>
        <div class="cart-price">${gp(item.qty * item.unitPrice)}</div>
        <button class="remove-btn" aria-label="Remove item">×</button>
      `;
      row.querySelector(".remove-btn").addEventListener("click", () => {
        state.cart = state.cart.filter(x => x.id !== item.id);
        renderCart();
      });
      cartItems.appendChild(row);
    });
  }

  const total = state.cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  grandTotal.textContent = gp(total);

  const problems = getGemRuleProblems();
  if (problems.length) {
    validationMessage.className = "validation-message";
    validationMessage.textContent = "⚠ " + problems[0];
  } else if (state.cart.some(x => x.type === "gem")) {
    validationMessage.className = "validation-message ok";
    validationMessage.textContent = "✓ Minimum 3 matching ore per gem requirement is met.";
  } else {
    validationMessage.className = "validation-message";
    validationMessage.textContent = "";
  }

  localStorage.setItem("koruxaOrder", JSON.stringify(state.cart));
}

function buildDiscordText() {
  if (!state.cart.length) return "Koruxa Order: (empty)";

  const grouped = {};
  state.cart.forEach(item => {
    const key = `${item.name}|${item.type}`;
    grouped[key] ??= { ...item, qty: 0 };
    grouped[key].qty += item.qty;
  });

  const lines = ["**Koruxa Ore & Gem Order**", ""];
  Object.values(grouped).forEach(item => {
    const label = item.type === "ore" ? "Ore" : "Uncut Gem";
    lines.push(`• ${item.name} ${label} × ${item.qty} — ${gp(item.qty * item.unitPrice)}`);
  });
  lines.push("");
  lines.push(`**Total: ${grandTotal.textContent}**`);
  lines.push("");
  lines.push("_Gem rule: 1 uncut gem requires 3–5 matching ore._");

  const problems = getGemRuleProblems();
  if (problems.length) {
    lines.push("");
    lines.push("⚠ Order does not currently meet the minimum matching-ore requirement.");
  }

  return lines.join("\n");
}

search.addEventListener("input", e => {
  state.search = e.target.value;
  renderMaterials();
});

document.querySelector("#clearOrder").addEventListener("click", () => {
  state.cart = [];
  renderCart();
});

document.querySelector("#copyOrder").addEventListener("click", async e => {
  const text = buildDiscordText();
  try {
    await navigator.clipboard.writeText(text);
    e.currentTarget.textContent = "Copied ✓";
  } catch {
    window.prompt("Copy your order:", text);
    e.currentTarget.textContent = "Copy Order for Discord";
    return;
  }
  setTimeout(() => e.currentTarget.textContent = "Copy Order for Discord", 1000);
});

try {
  const saved = JSON.parse(localStorage.getItem("koruxaOrder") || "[]");
  if (Array.isArray(saved)) state.cart = saved;
} catch {}

renderMaterials();
renderCart();
