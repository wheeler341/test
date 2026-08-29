// =====================================================
// KORUXA ORE & GEM MARKET
// 1 Gem requires 6 matching Ore
// =====================================================

const ORE_PER_GEM = 6;


// =====================================================
// DISCORD / ORDER ENDPOINT
//
// Leave blank for now.
// Once your Cloudflare Worker is ready,
// paste its URL between the quotes.
// =====================================================

const ORDER_ENDPOINT = "";


// =====================================================
// MARKET DATA
// =====================================================

const MATERIALS = [
  {
    name: "Dustite",
    orePrice: 1000,
    gemName: "Opal",
    gemPrice: 25000
  },

  {
    name: "Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Gold",
    orePrice: 1500,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Copite",
    orePrice: 550,
    gemName: "Amber",
    gemPrice: 27000
  },

  {
    name: "Velorite",
    orePrice: 650,
    gemName: "Aquastone",
    gemPrice: 29000
  },

  {
    name: "Crimsite",
    orePrice: 750,
    gemName: "Garnet",
    gemPrice: 31500
  },

  {
    name: "Shalore",
    orePrice: 850,
    gemName: "Frostgem",
    gemPrice: 33500
  },

  {
    name: "Noctite",
    orePrice: 950,
    gemName: "Voidopal",
    gemPrice: 35500
  },

  {
    name: "Auorite",
    orePrice: 1050,
    gemName: "Sunstone",
    gemPrice: 37500
  },

  {
    name: "Vexite",
    orePrice: 1150,
    gemName: "Duskgem",
    gemPrice: 39500
  },

  {
    name: "Zephyne",
    orePrice: 1250,
    gemName: "Stormheart",
    gemPrice: 41500
  },

  {
    name: "Korunite",
    orePrice: 1350,
    gemName: "Astralite",
    gemPrice: 44000
  },

  {
    name: "Drakonite",
    orePrice: 1450,
    gemName: "Emberstone",
    gemPrice: 46000
  },

  {
    name: "Potent Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Pyrethium",
    orePrice: 1550,
    gemName: "Magmaheart",
    gemPrice: 48000
  },

  {
    name: "Infernite",
    orePrice: 1650,
    gemName: "Pyreshard",
    gemPrice: 50000
  }
];


// =====================================================
// STATE
// =====================================================

const state = {
  cart: [],
  search: ""
};


// =====================================================
// ELEMENTS
// =====================================================

const list =
  document.querySelector("#materialList");

const template =
  document.querySelector("#materialTemplate");

const search =
  document.querySelector("#search");

const cartItems =
  document.querySelector("#cartItems");

const grandTotal =
  document.querySelector("#grandTotal");

const cartCount =
  document.querySelector("#cartCount");

const validationMessage =
  document.querySelector("#validationMessage");

const customerName =
  document.querySelector("#customerName");

const orderNotes =
  document.querySelector("#orderNotes");

const submitOrder =
  document.querySelector("#submitOrder");

const submitStatus =
  document.querySelector("#submitStatus");


// =====================================================
// HELPERS
// =====================================================

const gp = value =>
  value == null
    ? "N/A"
    : `${Number(value).toLocaleString()} GP`;

function createId() {

  return crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

}

function getMaterial(materialName) {

  return MATERIALS.find(
    material =>
      material.name === materialName
  );

}

function getCartQuantity(materialName, type) {

  return state.cart
    .filter(
      item =>
        item.name === materialName &&
        item.type === type
    )
    .reduce(
      (total, item) =>
        total + item.qty,
      0
    );

}

function getMaximumGems(materialName) {

  const oreQty =
    getCartQuantity(
      materialName,
      "ore"
    );

  return Math.floor(
    oreQty / ORE_PER_GEM
  );

}

function getRemainingGemAllowance(materialName) {

  const maxGems =
    getMaximumGems(
      materialName
    );

  const currentGems =
    getCartQuantity(
      materialName,
      "gem"
    );

  return Math.max(
    0,
    maxGems - currentGems
  );

}


// =====================================================
// ENFORCE GEM LIMITS
// =====================================================

function enforceGemRules() {

  MATERIALS.forEach(material => {

    const oreQty =
      getCartQuantity(
        material.name,
        "ore"
      );

    const allowedGems =
      Math.floor(
        oreQty / ORE_PER_GEM
      );

    let gemsSeen = 0;

    state.cart =
      state.cart.filter(item => {

        if (
          item.name !== material.name ||
          item.type !== "gem"
        ) {
          return true;
        }

        const remaining =
          allowedGems - gemsSeen;

        if (remaining <= 0) {
          return false;
        }

        if (item.qty > remaining) {
          item.qty = remaining;
        }

        gemsSeen += item.qty;

        return item.qty > 0;

      });

  });

}


// =====================================================
// MARKET CARDS
// =====================================================

function renderMaterials() {

  list.innerHTML = "";

  const filtered =
    MATERIALS.filter(material => {

      const text =
        `${material.name} ${material.gemName || ""}`
          .toLowerCase();

      return text.includes(
        state.search.toLowerCase()
      );

    });


  if (!filtered.length) {

    list.innerHTML = `
      <div class="no-results">
        No matching materials found.
      </div>
    `;

    return;

  }


  filtered.forEach(material => {

    const node =
      template.content.cloneNode(true);

    const title =
      node.querySelector("h3");

    const prices =
      node.querySelector(".prices");

    const buttons =
      [
        ...node.querySelectorAll(
          ".type-btn"
        )
      ];

    const qty =
      node.querySelector(".qty-input");

    const lineTotal =
      node.querySelector(".line-total");

    const add =
      node.querySelector(".add-btn");


    const oreButton =
      buttons.find(
        button =>
          button.dataset.type === "ore"
      );

    const gemButton =
      buttons.find(
        button =>
          button.dataset.type === "gem"
      );


    let selectedType = "ore";


    // =================================================
    // CARD DISPLAY
    // =================================================

    function updateCardDisplay() {

      if (
        selectedType === "gem" &&
        material.gemName
      ) {

        title.textContent =
          material.gemName;

        prices.innerHTML = `
          Matching Ore
          <b>${material.name}</b>
          <span class="dot">•</span>
          Gem Price
          <b>${gp(material.gemPrice)}</b>
        `;

      } else {

        title.textContent =
          material.name;

        if (material.gemName) {

          prices.innerHTML = `
            Ore
            <b>${gp(material.orePrice)}</b>
            <span class="dot">•</span>
            Gem
            <b>${material.gemName} — ${gp(material.gemPrice)}</b>
          `;

        } else {

          prices.innerHTML = `
            Ore
            <b>${gp(material.orePrice)}</b>
            <span class="dot">•</span>
            Gem
            <b>N/A</b>
          `;

        }

      }

    }


    // =================================================
    // AVAILABLE TYPES
    // =================================================

    if (material.orePrice == null) {

      oreButton.disabled = true;

    }


    if (
      material.gemPrice == null ||
      material.gemName == null
    ) {

      gemButton.disabled = true;

    }


    if (material.orePrice != null) {

      selectedType = "ore";

      oreButton.classList.add(
        "active"
      );

    } else if (
      material.gemPrice != null
    ) {

      selectedType = "gem";

      gemButton.classList.add(
        "active"
      );

    }


    function unitPrice() {

      return selectedType === "ore"
        ? material.orePrice
        : material.gemPrice;

    }


    // =================================================
    // GEM QUANTITY MAX
    // =================================================

    function updateQuantityLimits() {

      if (selectedType === "gem") {

        const remaining =
          getRemainingGemAllowance(
            material.name
          );

        qty.min = "1";

        qty.max =
          String(
            Math.max(
              remaining,
              1
            )
          );


        if (remaining <= 0) {

          qty.value = "1";

          qty.disabled = true;

          add.disabled = true;

          add.textContent =
            `Need ${ORE_PER_GEM} Ore`;

        } else {

          qty.disabled = false;

          add.disabled = false;

          let current =
            parseInt(
              qty.value || "1",
              10
            );


          current =
            Math.max(
              1,
              Math.min(
                current,
                remaining
              )
            );


          qty.value =
            String(current);

          add.textContent =
            "Add";

        }

      } else {

        qty.min = "1";

        qty.removeAttribute(
          "max"
        );

        qty.disabled = false;

        add.disabled = false;

        add.textContent =
          "Add";

      }

    }


    // =================================================
    // TOTAL
    // =================================================

    function updateLineTotal() {

      let amount =
        Math.max(
          1,
          parseInt(
            qty.value || "1",
            10
          )
        );


      if (selectedType === "gem") {

        const remaining =
          getRemainingGemAllowance(
            material.name
          );


        if (remaining > 0) {

          amount =
            Math.min(
              amount,
              remaining
            );

          qty.value =
            String(amount);

        }

      }


      const price =
        unitPrice();


      lineTotal.textContent =
        price == null
          ? "N/A"
          : gp(
              price * amount
            );

    }


    // =================================================
    // TYPE BUTTONS
    // =================================================

    buttons.forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (button.disabled) {
            return;
          }


          selectedType =
            button.dataset.type;


          buttons.forEach(btn => {

            btn.classList.toggle(
              "active",
              btn === button
            );

          });


          updateCardDisplay();

          updateQuantityLimits();

          updateLineTotal();

        }
      );

    });


    // =================================================
    // QUANTITY INPUT
    // =================================================

    qty.addEventListener(
      "input",
      () => {

        let amount =
          parseInt(
            qty.value || "1",
            10
          );


        if (
          !Number.isFinite(amount)
        ) {

          amount = 1;

        }


        if (selectedType === "gem") {

          const max =
            getRemainingGemAllowance(
              material.name
            );


          if (max > 0) {

            amount =
              Math.max(
                1,
                Math.min(
                  amount,
                  max
                )
              );

          }

        } else {

          amount =
            Math.max(
              1,
              amount
            );

        }


        qty.value =
          String(amount);


        updateLineTotal();

      }
    );


    // =================================================
    // ADD TO BASKET
    // =================================================

    add.addEventListener(
      "click",
      () => {

        if (add.disabled) {
          return;
        }


        let amount =
          Math.max(
            1,
            parseInt(
              qty.value || "1",
              10
            )
          );


        const price =
          unitPrice();


        if (price == null) {
          return;
        }


        if (selectedType === "gem") {

          const remaining =
            getRemainingGemAllowance(
              material.name
            );


          if (remaining <= 0) {
            return;
          }


          amount =
            Math.min(
              amount,
              remaining
            );

        }


        state.cart.push({

          id: createId(),

          name:
            material.name,

          type:
            selectedType,

          qty:
            amount,

          unitPrice:
            price

        });


        enforceGemRules();

        renderCart();

        renderMaterials();

      }
    );


    updateCardDisplay();

    updateQuantityLimits();

    updateLineTotal();

    list.appendChild(node);

  });

}


// =====================================================
// GEM VALIDATION
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
        `${material.gemName || material.name + " Gem"} requires ${requiredOre} ${material.name} Ore.`
      );

    }

  });


  return problems;

}


// =====================================================
// BASKET
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
        Your basket is empty.
      </div>
    `;

  } else {

    cartItems.innerHTML = "";


    state.cart.forEach(item => {

      const material =
        getMaterial(
          item.name
        );


      const displayName =
        item.type === "ore"
          ? `${item.name} Ore`
          : `${material?.gemName || item.name + " Gem"} (Uncut Gem)`;


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "cart-row";


      row.innerHTML = `

        <div>

          <div class="cart-name">
            ${displayName}
          </div>

          <div class="cart-meta">
            ${item.qty}
            ×
            ${gp(item.unitPrice)}
          </div>

        </div>


        <div class="cart-price">

          ${gp(
            item.qty *
            item.unitPrice
          )}

        </div>


        <button
          class="remove-btn"
          type="button"
          aria-label="Remove item"
        >
          ×
        </button>

      `;


      row
        .querySelector(
          ".remove-btn"
        )
        .addEventListener(
          "click",
          () => {


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


              const removed =
                gemsBefore -
                gemsAfter;


              if (removed > 0) {

                const material =
                  getMaterial(
                    materialName
                  );


                alert(

                  `${removed} ${material?.gemName || materialName + " Gem"} ` +

                  `${removed === 1 ? "was" : "were"} removed because there is no longer enough matching ore.`

                );

              }

            }


            renderCart();

            renderMaterials();

          }
        );


      cartItems.appendChild(
        row
      );

    });

  }


  // =================================================
  // TOTAL
  // =================================================

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


  // =================================================
  // VALIDATION
  // =================================================

  const problems =
    getGemRuleProblems();


  if (problems.length) {

    validationMessage.className =
      "validation-message";

    validationMessage.textContent =
      "⚠ " +
      problems[0];

  } else if (
    state.cart.some(
      item =>
        item.type === "gem"
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

    JSON.stringify(
      state.cart
    )

  );

}


// =====================================================
// ORDER PAYLOAD
// =====================================================

function buildOrderPayload() {

  const items =
    state.cart.map(item => {

      const material =
        getMaterial(
          item.name
        );


      return {

        oreName:
          item.name,

        itemName:
          item.type === "ore"
            ? `${item.name} Ore`
            : material?.gemName,

        type:
          item.type,

        quantity:
          item.qty,

        unitPrice:
          item.unitPrice,

        total:
          item.qty *
          item.unitPrice

      };

    });


  const total =
    state.cart.reduce(

      (sum, item) =>

        sum +
        item.qty *
        item.unitPrice,

      0

    );


  return {

    customerName:
      customerName.value.trim(),

    notes:
      orderNotes.value.trim(),

    items,

    total,

    gemRatio:
      ORE_PER_GEM,

    submittedAt:
      new Date().toISOString()

  };

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
// CUSTOMER INFO SAVE
// =====================================================

customerName.addEventListener(
  "input",
  () => {

    localStorage.setItem(
      "koruxaCustomerName",
      customerName.value
    );

  }
);


orderNotes.addEventListener(
  "input",
  () => {

    localStorage.setItem(
      "koruxaOrderNotes",
      orderNotes.value
    );

  }
);


// =====================================================
// CLEAR BASKET
// =====================================================

document
  .querySelector(
    "#clearOrder"
  )
  .addEventListener(
    "click",
    () => {

      if (!state.cart.length) {
        return;
      }


      const confirmed =
        confirm(
          "Clear everything from your basket?"
        );


      if (!confirmed) {
        return;
      }


      state.cart = [];


      submitStatus.textContent =
        "";


      renderCart();

      renderMaterials();

    }
  );


// =====================================================
// SUBMIT ORDER
// =====================================================

submitOrder.addEventListener(
  "click",
  async () => {

    submitStatus.className =
      "submit-status";

    submitStatus.textContent =
      "";


    enforceGemRules();

    renderCart();


    // ---------------------------------------------
    // EMPTY CART
    // ---------------------------------------------

    if (!state.cart.length) {

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Add something to your basket before submitting.";

      return;

    }


    // ---------------------------------------------
    // NAME REQUIRED
    // ---------------------------------------------

    const name =
      customerName.value.trim();


    if (!name) {

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Please enter your Discord or game name.";

      customerName.focus();

      return;

    }


    // ---------------------------------------------
    // GEM RULE CHECK
    // ---------------------------------------------

    const problems =
      getGemRuleProblems();


    if (problems.length) {

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        problems[0];

      return;

    }


    const order =
      buildOrderPayload();


    // ---------------------------------------------
    // WORKER NOT CONNECTED YET
    // ---------------------------------------------

    if (!ORDER_ENDPOINT) {

      console.log(
        "Order ready to submit:",
        order
      );


      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =
        "Order form is ready, but the Discord submission endpoint still needs to be connected.";

      return;

    }


    // ---------------------------------------------
    // SEND ORDER
    // ---------------------------------------------

    submitOrder.disabled = true;

    submitOrder.textContent =
      "Submitting...";


    try {

      const response =
        await fetch(
          ORDER_ENDPOINT,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify(
                order
              )

          }
        );


      if (!response.ok) {

        throw new Error(
          "Order submission failed."
        );

      }


      submitStatus.className =
        "submit-status success";


      submitStatus.textContent =
        "✓ Order submitted successfully!";


      submitOrder.textContent =
        "Order Submitted ✓";


      state.cart = [];


      orderNotes.value =
        "";


      localStorage.removeItem(
        "koruxaOrderNotes"
      );


      renderCart();

      renderMaterials();


      setTimeout(
        () => {

          submitOrder.textContent =
            "Submit Order";

        },
        2500
      );


    } catch (error) {

      console.error(error);


      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =
        "Something went wrong submitting the order. Please try again.";


      submitOrder.textContent =
        "Submit Order";

    } finally {

      submitOrder.disabled =
        false;

    }

  }
);


// =====================================================
// LOAD SAVED INFORMATION
// =====================================================

try {

  const savedCart =
    JSON.parse(

      localStorage.getItem(
        "koruxaOrder"
      ) || "[]"

    );


  if (
    Array.isArray(
      savedCart
    )
  ) {

    state.cart =
      savedCart;

  }

} catch {

  state.cart = [];

}


customerName.value =
  localStorage.getItem(
    "koruxaCustomerName"
  ) || "";


orderNotes.value =
  localStorage.getItem(
    "koruxaOrderNotes"
  ) || "";


// =====================================================
// START
// =====================================================

enforceGemRules();

renderMaterials();

renderCart();
