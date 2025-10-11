
// Range Calculator
(function () {
  const root = document.getElementById('ebike-calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  // Elements
  const batteryCapacityEl = $('battery-capacity');
  const batteryUnitEl = $('battery-unit');
  const voltageEl = $('voltage');
  const voltageWrap = $('voltage-wrap');
  const rangeUnitEl = $('range-unit');
  const motorPowerEl = $('motor-power');
  const riderWeightEl = $('rider-weight');
  const terrainEl = $('terrain');
  const pedalAssistEl = $('pedal-assist');
  const calculateBtn = $('calculate');
  const resetBtn = $('reset');
  const resultWrap = $('result');
  const rangeOutput = $('range-output');
  const breakdown = $('breakdown');

  // --- SAFE number input restriction function ---
  function restrictNumberInput(el) {
    el.addEventListener('input', () => {
      let val = el.value.replace(/[^0-9.]/g, ''); // allow digits + dot
      const parts = val.split('.');
      if (parts.length > 2) {
        // keep only first dot
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      el.value = val;
    });
  }

  // Apply restriction to all number inputs inside calculator
  root.querySelectorAll('input[type=number]').forEach(el => restrictNumberInput(el));

  // Error helpers
  function showErrorFor(el, msg) {
    const err = el.parentElement.querySelector('.error-message');
    if (err) {
      err.textContent = msg || '';
      err.style.display = msg ? 'block' : 'none';
    }
  }
  function clearAllErrors() {
    root.querySelectorAll('.error-message').forEach(e => { e.style.display = 'none'; e.textContent = ''; });
  }

  // Show/hide voltage when unit changes
  function toggleVoltageVisibility() {
    voltageWrap.style.display = (batteryUnitEl.value === 'ah') ? 'block' : 'none';
  }
  batteryUnitEl.addEventListener('change', toggleVoltageVisibility);
  toggleVoltageVisibility();

  // === Original calculation function (kept intact except safe voltage default) ===
  function calculate() {
    clearAllErrors();

    const rawBattery = parseFloat(batteryCapacityEl.value);
    if (!rawBattery || rawBattery <= 0) {
      showErrorFor(batteryCapacityEl, 'Please enter a valid positive battery capacity.');
      batteryCapacityEl.focus();
      return;
    }

    let batteryWh = 0;
    if (batteryUnitEl.value === 'ah') {
      const voltageRaw = (voltageEl.value || '').trim();
      let voltage = voltageRaw === '' ? 48 : parseFloat(voltageRaw);
      if (!voltage || voltage <= 0) {
        showErrorFor(voltageEl, 'Please enter a valid voltage (V).');
        voltageEl.focus();
        return;
      }
      batteryWh = rawBattery * voltage;
    } else {
      batteryWh = rawBattery;
    }

    const baselineWhPerKm = 15;
    let adjustedWhPerKm = baselineWhPerKm;
    const multipliers = { motor:1, weight:1, terrain:1, pedal:1 };

    const motorPower = parseFloat(motorPowerEl.value);
    if (motorPower && motorPower > 0) {
      multipliers.motor = 1 + ((motorPower - 250) / 1000);
      multipliers.motor = clamp(multipliers.motor, 0.6, 2.0);
      adjustedWhPerKm *= multipliers.motor;
    }

    const riderWeight = parseFloat(riderWeightEl.value);
    if (riderWeight && riderWeight > 0) {
      multipliers.weight = 1 + ((riderWeight - 75) / 200);
      multipliers.weight = clamp(multipliers.weight, 0.7, 1.6);
      adjustedWhPerKm *= multipliers.weight;
    }

    const terrain = terrainEl.value;
    if (terrain) {
      const terrainMap = { flat:1.0, rolling:1.05, hilly:1.2, mountain:1.35 };
      multipliers.terrain = terrainMap[terrain] || 1;
      adjustedWhPerKm *= multipliers.terrain;
    }

    const pedal = pedalAssistEl.value;
    if (pedal) {
      const pedalMap = { none:0.75, low:0.85, medium:1.0, high:1.2 };
      multipliers.pedal = pedalMap[pedal] || 1;
      adjustedWhPerKm *= multipliers.pedal;
    }

    const rangeKm = batteryWh / adjustedWhPerKm;
    const rangeMiles = rangeKm / 1.609344;
    const chosenUnit = rangeUnitEl.value;
    const displayRange = (chosenUnit === 'km') ? `${rangeKm.toFixed(2)} km` : `${rangeMiles.toFixed(2)} miles`;

    rangeOutput.textContent = displayRange;
    resultWrap.hidden = false;

    const lines = [];
    lines.push(`<p class="f12 fade-left ad1"><strong>Battery:</strong> ${batteryWh.toLocaleString(undefined,{maximumFractionDigits:2})} Wh </p>`);
    lines.push(`<p class="f12 fade-left ad2"><strong>Baseline consumption:</strong> ${baselineWhPerKm} Wh/km </p>`);
    lines.push(`<p class="f12 fade-left ad3"><strong>Adjusted consumption:</strong> ${adjustedWhPerKm.toFixed(2)} Wh/km </p>`);

    const applied = [];
    if (multipliers.motor !== 1) applied.push(`Motor power ×${multipliers.motor.toFixed(2)}`);
    if (multipliers.weight !== 1) applied.push(`Rider weight ×${multipliers.weight.toFixed(2)}`);
    if (multipliers.terrain !== 1) applied.push(`Terrain ×${multipliers.terrain.toFixed(2)}`);
    if (multipliers.pedal !== 1) applied.push(`Pedal assist ×${multipliers.pedal.toFixed(2)}`);
    if (applied.length) lines.push(`<strong>Applied factors:</strong> ${applied.join(' • ')}`);

    lines.push(`<p class="f12 fade-left ad4"><strong>Estimated range:</strong> ${displayRange} </p>`);
    lines.push(`<p class="f12 fade-left ad5"><span class=small>Note: This is an estimate. Real-world range depends on riding style, wind, stops/starts, tire pressure and more.</span> </p>`);

    breakdown.innerHTML = lines.join('');
  }

  function resetForm() {
    batteryCapacityEl.value = '';
    batteryUnitEl.value = 'ah';
    voltageEl.value = '';
    rangeUnitEl.value = 'km';
    motorPowerEl.value = '';
    riderWeightEl.value = '';
    terrainEl.value = '';
    pedalAssistEl.value = '';
    resultWrap.hidden = true;
    clearAllErrors();
    toggleVoltageVisibility();
  }

  calculateBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
  batteryCapacityEl.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });

})();







 // Charging Cost Calculator


// Charging Cost Calculator (with decimal-safe input + reset + formatted result)
(function() {
    const id = "evcalc1_";

    const batteryInput = document.getElementById(id + "battery");
    const costInput = document.getElementById(id + "cost");
    const unitSelect = document.getElementById(id + "unit");
    const chargeSlider = document.getElementById(id + "charge");
    const display = document.getElementById(id + "display");
    const capacityError = document.getElementById(id + "capacity_error");
    const costError = document.getElementById(id + "cost_error");
    const resultWrap = document.getElementById(id + "result");
    const resultOutput = document.getElementById(id + "result_output");
    const button = document.getElementById(id + "btn");
    const resetBtn = document.getElementById(id + "reset");

    // --- Make inputs text (so leading "." works reliably) and hint numeric keyboard on mobiles
    [batteryInput, costInput].forEach(inp => {
        try { inp.type = "text"; } catch (e) {}
        inp.setAttribute("inputmode", "decimal");
        inp.setAttribute("autocapitalize", "off");
        inp.setAttribute("autocomplete", "off");
    });

    // Sanitizer that allows only: digits, one dot (.), and an optional leading + or -
    function sanitizeNumberLikeString(fullStr) {
        let s = fullStr.replace(/[^0-9.+-]/g, '');
        const firstDot = s.indexOf('.');
        if (firstDot !== -1) {
            s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
        }
        let sign = '';
        if (s[0] === '+' || s[0] === '-') sign = s[0];
        s = (sign ? sign : '') + s.slice(sign ? 1 : 0).replace(/[+-]/g, '');
        return s;
    }

    // Input handler (preserves caret)
    function numericInputHandler(e) {
        const el = e.target;
        const oldVal = el.value;
        const selStart = el.selectionStart || oldVal.length;
        const newFull = sanitizeNumberLikeString(oldVal);
        const prefix = oldVal.slice(0, selStart);
        const newPrefix = sanitizeNumberLikeString(prefix);
        const newCaret = newPrefix.length;

        if (newFull !== oldVal) {
            el.value = newFull;
            try { el.setSelectionRange(newCaret, newCaret); } catch (err) {}
        }
    }

    [batteryInput, costInput].forEach(inp => {
        inp.addEventListener('input', numericInputHandler);
        inp.addEventListener('paste', ev => setTimeout(() => numericInputHandler({ target: inp }), 0));
        inp.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                button.click();
            }
        });
    });

    // Live update charge %
    chargeSlider.addEventListener("input", () => {
        display.textContent = chargeSlider.value + "%";
    });

    function clearErrors() {
        capacityError.style.display = "none";
        costError.style.display = "none";
    }

    // --- Calculate ---
    button.addEventListener("click", () => {
        clearErrors();

        const batteryRaw = batteryInput.value.trim();
        const costRaw = costInput.value.trim();
        const battery = parseFloat(batteryRaw);
        const cost = parseFloat(costRaw);
        const unit = unitSelect.value;
        const charge = parseInt(chargeSlider.value, 10);

        if (isNaN(battery) || battery <= 0) {
            capacityError.style.display = "block";
            return;
        }
        if (isNaN(cost) || cost <= 0) {
            costError.style.display = "block";
            return;
        }

        let batteryKWh = battery;
        if (unit === "Ah") {
            const voltage = 36; // Standard ebike voltage
            batteryKWh = (battery * voltage) / 1000;
        }

        // Correct logic: more current charge => less cost needed
        const requiredCharge = batteryKWh * (100 - charge) / 100;
        const totalCost = requiredCharge * cost;

        const breakdown = [];
        breakdown.push(`<h2 class="fade-left main-result">Total Charging Cost: &nbsp;  $${totalCost.toFixed(2)} </h2>`);
        breakdown.push(`<p class="f12 fade-left ad1"><strong>Battery:</strong> ${batteryKWh.toFixed(2)} kWh </p>`);
        breakdown.push(`<p class="f12 fade-left ad2"><strong>Current Charge:</strong> ${charge}% </p>`);
        breakdown.push(`<p class="f12 fade-left ad3"><strong>Energy Needed:</strong> ${requiredCharge.toFixed(2)} kWh </p>`);
        breakdown.push(`<p class="f12 fade-left ad4"><strong>Cost per kWh:</strong> $${cost.toFixed(2)} </p>`);

        resultOutput.innerHTML = breakdown.join('');
        resultWrap.hidden = false;
    });

    // --- Reset ---
    resetBtn.addEventListener("click", () => {
        batteryInput.value = "";
        costInput.value = "";
        unitSelect.value = "Ah";
        chargeSlider.value = 0;
        display.textContent = "0%";
        clearErrors();
        resultWrap.hidden = true;
    });
})();
















// Function to open modal with animation
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalContent = modal.querySelector('.modal-content');
  
  // Make the modal visible first (display it block)
  modal.style.display = "block";
  
  // Force reflow to reset the state before starting the animation
  modal.offsetHeight; // Accessing this property forces a reflow
  
  // Add classes for opening animation after a brief timeout to trigger the CSS transitions
  setTimeout(() => {
    modal.classList.add('show');
    modalContent.classList.add('show');
  }, 10); // Small timeout to allow the browser to register the initial state
}

// Function to close modal with animation
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalContent = modal.querySelector('.modal-content');
  
  // Add classes for closing animation
  modal.classList.remove('show');
  modalContent.classList.remove('show');
  
  // Add hide classes for the close animation
  modal.classList.add('hide');
  modalContent.classList.add('hide');
  
  // After the closing animation duration (0.5s), hide the modal from view
  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove('hide');
    modalContent.classList.remove('hide');
  }, 500); // Match the duration of the closing animation (500ms)
}

// Event listeners for buttons and close buttons
document.querySelectorAll('.tool-opener').forEach(button => {
  button.addEventListener('click', function() {
    const modalId = this.getAttribute('data-modal');
    openModal(modalId);
  });
});

document.querySelectorAll('.close-btn').forEach(button => {
  button.addEventListener('click', function() {
    const modalId = this.getAttribute('data-modal');
    closeModal(modalId);
  });
});

// Close modal if clicked outside the content area
window.addEventListener('click', function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
});
