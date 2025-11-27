document.addEventListener("DOMContentLoaded", function () {

    // If the page has NO calculator elements, EXIT main.js completely
    if (!document.querySelector("[id$='_calculator']") &&
        !document.querySelector(".calculator-area") &&
        !document.querySelector(".card")) {

        return; // <-- Universal Fix: stops ALL calculator code on other pages
    }



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









// BATTERY LIFE CYCLE ESTIMATOR


(function() {
  const root = document.getElementById('battery-life-calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  // Elements
  const capacityEl = $('bl_battery-capacity');
  const unitEl = $('bl_battery-unit');
  const voltageEl = $('bl_voltage');
  const voltageWrap = $('bl_voltage-wrap');
  const usageEl = $('bl_daily-usage');
  const usageUnitEl = $('bl_usage-unit');
  const cyclesEl = $('bl_charge-cycles');
  const resultWrap = $('bl_result');
  const breakdown = $('bl_breakdown');
  const calcBtn = $('bl_calculate');
  const resetBtn = $('bl_reset');

  // Restrict numbers
  function restrictNumberInput(el) {
    el.addEventListener('input', () => {
      let val = el.value.replace(/[^0-9.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
      el.value = val;
    });
  }
  root.querySelectorAll('input[type=number]').forEach(el => restrictNumberInput(el));

  // Errors
  function showError(el, msg) {
    const err = el.parentElement.querySelector('.error-message');
    if (err) { err.textContent = msg; err.style.display = msg ? 'block' : 'none'; }
  }
  function clearErrors() {
    root.querySelectorAll('.error-message').forEach(e => { e.textContent=''; e.style.display='none'; });
  }

  // Toggle voltage
  function toggleVoltage() {
    voltageWrap.style.display = (unitEl.value === 'ah') ? 'block' : 'none';
  }
  unitEl.addEventListener('change', toggleVoltage);
  toggleVoltage();

  // Main calculation
  function calculate() {
    clearErrors();

    const capacity = parseFloat(capacityEl.value);
    if (!capacity || capacity <= 0) {
      showError(capacityEl, 'Enter valid positive battery capacity.');
      capacityEl.focus();
      return;
    }

    let voltage = 48;
    if (unitEl.value === 'ah') {
      const vRaw = voltageEl.value.trim();
      if (vRaw !== '') voltage = parseFloat(vRaw);
      if (!voltage || voltage <= 0) {
        showError(voltageEl, 'Please enter a valid voltage.');
        voltageEl.focus();
        return;
      }
    }

    const usage = parseFloat(usageEl.value);
    if (!usage || usage <= 0) {
      showError(usageEl, 'Enter valid daily usage.');
      usageEl.focus();
      return;
    }

    const cycles = parseFloat(cyclesEl.value);
    if (!cycles || cycles <= 0) {
      showError(cyclesEl, 'Enter valid full charge cycles.');
      cyclesEl.focus();
      return;
    }

    // Convert to Wh
    const batteryWh = (unitEl.value === 'ah') ? capacity * voltage : capacity;
    const whPerKm = 15;
    const totalWh = batteryWh * cycles;
    const lifetimeKm = totalWh / whPerKm;
    const lifetimeMiles = lifetimeKm / 1.609344;
    const chosenUnit = usageUnitEl.value;
    const displayRange = (chosenUnit === 'km')
      ? `${lifetimeKm.toFixed(2)} km`
      : `${lifetimeMiles.toFixed(2)} miles`;

    // Battery life estimation (in years/months)
    const years = cycles / 365;
    const months = cycles / 30;
    const displayLife = `${years.toFixed(2)} years (${months.toFixed(1)} months)`;

    // Output only inside breakdown
    resultWrap.hidden = false;
    const lines = [];
    lines.push(`<h2 class="fade-left main-result ad1"><strong>Estimated Battery Life:</strong> ${displayLife}</h2>`);
    lines.push(`<h3 class="fade-left main-result ad2"><strong>Estimated Total Range:</strong> ${displayRange}</h3>`);
    lines.push(`<p class="f12 fade-left ad3"><strong>Battery Energy:</strong> ${batteryWh.toLocaleString(undefined,{maximumFractionDigits:2})} Wh</p>`);
    lines.push(`<p class="f12 fade-left ad4"><strong>Charge Cycles:</strong> ${cycles}</p>`);
    lines.push(`<p class="f12 fade-left ad5"><strong>Total Lifetime Energy:</strong> ${totalWh.toLocaleString(undefined,{maximumFractionDigits:0})} Wh</p>`);
    lines.push(`<p class="f12 fade-left ad6"><span class='small'>Assuming one full charge per day and average consumption of ${whPerKm} Wh/km.</span></p>`);
    breakdown.innerHTML = lines.join('');
  }

  // Reset
  function resetForm() {
    capacityEl.value = '';
    unitEl.value = 'ah';
    voltageEl.value = '';
    usageEl.value = '';
    usageUnitEl.value = 'km';
    cyclesEl.value = '';
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();









// CHARGING TIME CALCULATOR


(function(){
  const root = document.getElementById('charging-time-calculator');
  if (!root) return;
  const $ = id => root.querySelector('#'+id);

  // Elements
  const capacityEl = $('ct_battery-capacity');
  const unitEl = $('ct_capacity-unit');
  const voltageEl = $('ct_voltage');
  const voltageWrap = $('ct_voltage-wrap');
  const currentEl = $('ct_charger-current');
  const efficiencyEl = $('ct_efficiency');
  const resultWrap = $('ct_result');
  const breakdown = $('ct_breakdown');
  const calcBtn = $('ct_calculate');
  const resetBtn = $('ct_reset');

  // Restrict to numbers + one dot
  root.querySelectorAll('input[type=number]').forEach(el=>{
    el.addEventListener('input',()=>{
      let val = el.value.replace(/[^0-9.]/g,'');
      const parts = val.split('.');
      if(parts.length>2) val = parts[0]+'.'+parts.slice(1).join('');
      el.value = val;
    });
  });

  // Show/hide voltage field
  function toggleVoltage(){
    voltageWrap.style.display = (unitEl.value==='ah')?'block':'none';
  }
  unitEl.addEventListener('change',toggleVoltage);
  toggleVoltage();

  // Error handling
  function showError(el,msg){
    const err = el.parentElement.querySelector('.error-message');
    if(err){ err.textContent = msg; err.style.display = msg ? 'block':'none'; }
  }
  function clearErrors(){
    root.querySelectorAll('.error-message').forEach(e=>{ e.textContent=''; e.style.display='none'; });
  }

  // Main Calculation
  function calculate(){
    clearErrors();

    const capacity = parseFloat(capacityEl.value);
    if(!capacity || capacity<=0){ showError(capacityEl,'Enter valid positive capacity.'); return; }

    let voltage = 48;
    if(unitEl.value==='ah'){
      const vRaw = voltageEl.value.trim();
      if(vRaw!=='') voltage = parseFloat(vRaw);
      if(!voltage || voltage<=0){ showError(voltageEl,'Enter valid voltage.'); return; }
    }

    const chargerCurrent = parseFloat(currentEl.value);
    if(!chargerCurrent || chargerCurrent<=0){ showError(currentEl,'Enter valid charger output current.'); return; }

    let efficiency = parseFloat(efficiencyEl.value);
    if(!efficiency || efficiency<=0 || efficiency>100) efficiency = 90;

    // Convert capacity to Wh
    const batteryWh = (unitEl.value==='ah') ? capacity * voltage : capacity;

    // Charger power in W (with efficiency)
    const chargerPower = voltage * chargerCurrent * (efficiency / 100);

    // Charging time (hours)
    const chargingTimeHrs = batteryWh / chargerPower;

    const hours = Math.floor(chargingTimeHrs);
    const minutes = Math.round((chargingTimeHrs - hours) * 60);

    resultWrap.hidden = false;
    const lines = [];
    lines.push(`<h2 class="fade-left main-result ad1"><strong>Estimated Charging Time:</strong> ${hours} h ${minutes} min</h2>`);
    lines.push(`<p class="f12 fade-left ad2"><strong>Battery Energy:</strong> ${batteryWh.toLocaleString(undefined,{maximumFractionDigits:1})} Wh</p>`);
    lines.push(`<p class="f12 fade-left ad3"><strong>Charger Power:</strong> ${chargerPower.toLocaleString(undefined,{maximumFractionDigits:1})} W (at ${efficiency}% efficiency)</p>`);
    lines.push(`<p class="f12 fade-left ad4"><span class="small">Actual time may vary due to charger tapering and BMS protection.</span></p>`);
    breakdown.innerHTML = lines.join('');
  }

  // Reset
  function resetForm(){
    capacityEl.value='';
    unitEl.value='ah';
    voltageEl.value='';
    currentEl.value='';
    efficiencyEl.value='';
    resultWrap.hidden=true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener('click',calculate);
  resetBtn.addEventListener('click',resetForm);
})();











// MOTOR POWER & SPEED CALCULATOR
(function(){
  const root = document.getElementById('motor-power-calculator');
  if(!root) return;
  const $ = id => root.querySelector('#'+id);

  // Elements
  const powerEl = $('mp_motor-power');
  const wheelEl = $('mp_wheel-size');
  const weightEl = $('mp_total-weight');
  const effEl = $('mp_efficiency');
  const posEl = $('mp_position');
  const gradeEl = $('mp_grade');
  const resultWrap = $('mp_result');
  const breakdown = $('mp_breakdown');
  const calcBtn = $('mp_calculate');
  const resetBtn = $('mp_reset');

  // Input restriction: digits + single dot
  root.querySelectorAll('input[type=number]').forEach(el=>{
    el.addEventListener('input',()=>{
      let val = el.value.replace(/[^0-9.]/g,'');
      const parts = val.split('.');
      if(parts.length>2) val = parts[0]+'.'+parts.slice(1).join('');
      el.value = val;
    });
  });

  // Error handling
  function showError(el,msg){
    const err = el.parentElement.querySelector('.error-message');
    if(err){ err.textContent = msg; err.style.display = msg ? 'block':'none'; }
  }
  function clearErrors(){
    root.querySelectorAll('.error-message').forEach(e=>{ e.textContent=''; e.style.display='none'; });
  }

  // Map position to CdA (m^2)
  function positionCdA(pos) {
    if(pos === 'tucked') return 0.40;
    if(pos === 'relaxed') return 0.70;
    return 0.60; // upright
  }

  // Numeric solver: find v (m/s) satisfying power_available = F_total(v) * v
  function solveSpeedForPower(powerW, massKg, grade, Crr, CdA, rho, eff) {
    const powerAvailable = powerW * eff;
    if (powerAvailable <= 0) return 0;

    let lo = 0.1;
    let hi = 60; // m/s upper bound
    for(let i=0;i<80;i++){
      const mid = (lo + hi)/2;
      const rollingAndGrade = (Crr * massKg * 9.81) + (massKg * 9.81 * grade);
      const demand = rollingAndGrade * mid + 0.5 * rho * CdA * Math.pow(mid,3);
      if (demand > powerAvailable) hi = mid;
      else lo = mid;
    }
    return (lo+hi)/2;
  }

  function calculate(){
    clearErrors();

    const power = parseFloat(powerEl.value);
    if(!power || power <= 0) { showError(powerEl, 'Enter valid motor power (W).'); powerEl.focus(); return; }

    const wheel = parseFloat(wheelEl.value);
    if(!wheel || wheel <= 0) { showError(wheelEl, 'Enter valid wheel diameter (inch).'); wheelEl.focus(); return; }

    const mass = parseFloat(weightEl.value);
    if(!mass || mass <= 0) { showError(weightEl, 'Enter valid total weight (kg).'); weightEl.focus(); return; }

    let efficiency = parseFloat(effEl.value);
    if(!efficiency || efficiency <= 0 || efficiency > 100) efficiency = 85;
    const eff = efficiency / 100;

    const pos = posEl.value;
    const CdA = positionCdA(pos);

    const grade = parseFloat(gradeEl.value) || 0;

    // Environmental / constants
    const rho = 1.225; // air density kg/m3
    const Crr = 0.008; // rolling resistance

    // Solve speed (m/s) then convert to km/h
    const v_m_s = solveSpeedForPower(power, mass, grade, Crr, CdA, rho, eff);
    const v_kmh = v_m_s * 3.6;

    // Output formatting
    resultWrap.hidden = false;
    const lines = [];
    lines.push(`<h2 class="fade-left main-result ad1"><strong>Estimated Top Speed:</strong> ${v_kmh.toFixed(1)} km/h</h2>`);
    lines.push(`<p class="f12 fade-left ad2"><strong>Motor Power:</strong> ${power} W (at ${efficiency}% system efficiency)</p>`);
    lines.push(`<p class="f12 fade-left ad3"><strong>Total Weight:</strong> ${mass.toFixed(0)} kg</p>`);
    lines.push(`<p class="f12 fade-left ad4"><strong>Riding Position (CdA):</strong> ${pos.charAt(0).toUpperCase()+pos.slice(1)} — ${CdA.toFixed(2)} m²</p>`);
    lines.push(`<p class="f12 fade-left ad5"><strong>Wheel Size:</strong> ${wheel.toFixed(1)}" — ${(wheel*25.4).toFixed(0)} mm</p>`);
    lines.push(`<p class="f12 fade-left ad6"><strong>Road Grade:</strong> ${(grade*100).toFixed(1)} %</p>`);
    lines.push(`<p class="f12 fade-left ad7"><span class="small">Model uses rolling resistance + grade + aerodynamic drag. Real-world top speed also depends on gearing, controller limits, battery voltage under load, and wind.</span></p>`);

    breakdown.innerHTML = lines.join('');
  }

  function resetForm(){
    powerEl.value='';
    wheelEl.value='';
    weightEl.value='';
    effEl.value='';
    posEl.value='upright';
    gradeEl.value='0';
    resultWrap.hidden=true;
    clearErrors();
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();










// ======================================================
// ⚡ ELECTRICITY COST PER 100 KM CALCULATOR
// ======================================================
(function(){
  const root = document.getElementById('ec100_calculator');
  if(!root) return;
  const $ = id => root.querySelector('#'+id);

  const capEl = $('ec100_capacity'),
        unitEl = $('ec100_unit'),
        voltEl = $('ec100_voltage'),
        rangeEl = $('ec100_range'),
        costEl = $('ec100_cost'),
        resultWrap = $('ec100_result'),
        breakdown = $('ec100_breakdown'),
        calcBtn = $('ec100_calculate'),
        resetBtn = $('ec100_reset'),
        voltWrap = $('ec100_voltage-wrap');

  // restrict to numbers + one dot
  root.querySelectorAll('input[type=number]').forEach(el=>{
    el.addEventListener('input',()=>{
      let val = el.value.replace(/[^0-9.]/g,'');
      const parts = val.split('.');
      if(parts.length>2) val = parts[0]+'.'+parts.slice(1).join('');
      el.value = val;
    });
  });

  function showError(el,msg){
    const err = el.parentElement.querySelector('.error-message');
    if(err){ err.textContent = msg; err.style.display = msg ? 'block':'none'; }
  }
  function clearErrors(){
    root.querySelectorAll('.error-message').forEach(e=>{ e.textContent=''; e.style.display='none'; });
  }

  // toggle voltage field
  function toggleVoltage(){ voltWrap.style.display = (unitEl.value==='ah') ? 'block' : 'none'; }
  unitEl.addEventListener('change',toggleVoltage); toggleVoltage();

  function calculate(){
    clearErrors();

    const cap = parseFloat(capEl.value);
    if(!cap || cap<=0){ showError(capEl,'Enter valid battery capacity.'); return; }

    let voltage = 48;
    if(unitEl.value==='ah'){
      const vRaw = voltEl.value.trim();
      if(vRaw!=='') voltage=parseFloat(vRaw);
      if(!voltage||voltage<=0){ showError(voltEl,'Enter valid voltage.'); return; }
    }

    const range = parseFloat(rangeEl.value);
    if(!range||range<=0){ showError(rangeEl,'Enter valid range per full charge.'); return; }

    const cost = parseFloat(costEl.value);
    if(!cost||cost<=0){ showError(costEl,'Enter valid electricity cost.'); return; }

    // convert to kWh
    const batteryWh = (unitEl.value==='ah') ? cap*voltage : cap;
    const batteryKWh = batteryWh / 1000;

    // cost per full charge
    const fullChargeCost = batteryKWh * cost;

    // energy per km (kWh/km)
    const kWhPerKm = batteryKWh / range;

    // cost per 100 km
    const costPer100 = kWhPerKm * 100 * cost;

    resultWrap.hidden=false;
    const lines=[];
    lines.push(`<h2 class="fade-left main-result ad1"><strong>Electricity Cost per 100 km:</strong> ${costPer100.toFixed(2)} </h2>`);
    lines.push(`<p class="f12 fade-left ad2"><strong>Cost per Full Charge:</strong> ${fullChargeCost.toFixed(2)}</p>`);
    lines.push(`<p class="f12 fade-left ad3"><strong>Battery Energy:</strong> ${batteryKWh.toFixed(2)} kWh</p>`);
    lines.push(`<p class="f12 fade-left ad4"><strong>Range per Charge:</strong> ${range.toFixed(1)} km</p>`);
    lines.push(`<p class="f12 fade-left ad5"><span class="small">Assuming full discharge and recharge each cycle. Actual cost may vary due to charger efficiency and terrain.</span></p>`);
    breakdown.innerHTML=lines.join('');
  }



  function resetForm(){
    capEl.value='';
    unitEl.value='ah';
    voltEl.value='';
    rangeEl.value='';
    costEl.value='';
    resultWrap.hidden=true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener('click',calculate);
  resetBtn.addEventListener('click',resetForm);
})();














// CO₂ SAVINGS CALCULATOR
(function () {
  const root = document.getElementById('co2_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  // Elements
  const distanceEl = $('co2_distance');
  const unitEl = $('co2_unit');
  const vehicleEl = $('co2_vehicle');
  const whkmEl = $('co2_whkm');
  const resultWrap = $('co2_result');
  const breakdown = $('co2_breakdown');
  const calcBtn = $('co2_calculate');
  const resetBtn = $('co2_reset');

  // Restrict inputs to numbers + decimal
  root.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling; // after small.muted
    if (err && err.classList.contains('error-message')) {
      err.textContent = msg;
      err.style.display = msg ? 'block' : 'none';
    }
  }
  function clearErrors() {
    root.querySelectorAll('.error-message').forEach(e => {
      e.textContent = '';
      e.style.display = 'none';
    });
  }

  // Main Calc
  function calculate() {
    clearErrors();

    const dist = parseFloat(distanceEl.value);
    if (!dist || dist <= 0) {
      showError(distanceEl, "Enter a valid distance.");
      return;
    }

    const whkm = parseFloat(whkmEl.value || "15");
    if (!whkm || whkm <= 0) {
      showError(whkmEl, "Enter valid Wh per km.");
      return;
    }

    // Unit conversion
    const km = (unitEl.value === 'km') ? dist : dist * 1.60934;

    // Vehicle CO₂ emissions
    const CO2_MOTORCYCLE = 72;   // g/km
    const CO2_CAR = 192;         // g/km

    let vehicleCO2 = CO2_MOTORCYCLE;
    if (vehicleEl.value === "car") vehicleCO2 = CO2_CAR;

    // eBike CO₂ = electricity generation (global avg ~ 475 g/kWh)
    const GRID_CO2 = 475; // g per kWh
    const ebike_kwh = (whkm * km) / 1000;
    const ebikeCO2 = ebike_kwh * GRID_CO2;

    const vehicleCO2_total = km * vehicleCO2;

    const savedDaily = vehicleCO2_total - ebikeCO2;
    const savedMonthly = savedDaily * 30;
    const savedYearly  = savedDaily * 365;

    // Output Result
    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Daily CO₂ Saved:</strong> ${(savedDaily/1000).toFixed(2)} kg</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Monthly CO₂ Saved:</strong> ${(savedMonthly/1000).toFixed(2)} kg</h3>`);
    lines.push(`<h3 class="fade-left ad2"><strong>Yearly CO₂ Saved:</strong> ${(savedYearly/1000).toFixed(2)} kg</h3>`);

    lines.push(`<p class="small fade-left ad3">Compared to: <strong>${vehicleEl.value === 'motorcycle' ? 'Petrol Motorcycle' : 'Petrol Car'}</strong></p>`);
    lines.push(`<p class="small fade-left ad4">Based on average eBike consumption: <strong>${whkm} Wh/km</strong></p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    distanceEl.value = "";
    unitEl.value = "km";
    vehicleEl.value = "motorcycle";
    whkmEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();















// BATTERY REPLACEMENT COST ESTIMATOR
(function () {
  const root = document.getElementById('battery_replacement_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  // Elements
  const capacityEl = $('br_capacity');
  const unitEl = $('br_unit');
  const voltageEl = $('br_voltage');
  const voltageWrap = $('br_voltage_wrap');
  const cyclesEl = $('br_cycles');
  const priceEl = $('br_price');
  const whkmEl = $('br_whkm');
  const resultWrap = $('br_result');
  const breakdown = $('br_breakdown');
  const calcBtn = $('br_calculate');
  const resetBtn = $('br_reset');

  // Allow numbers + decimal only
  root.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  // Hide/show voltage input
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener('change', toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // Main calculation
  function calculate() {
    clearErrors();

    // Battery Capacity
    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0) return showError(capacityEl, "Enter valid capacity.");

    // Voltage
    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0)
        return showError(voltageEl, "Enter valid voltage.");
    }

    // Cycles
    const cycles = parseFloat(cyclesEl.value);
    if (!cycles || cycles <= 0)
      return showError(cyclesEl, "Enter valid cycle count.");

    // Price
    const price = parseFloat(priceEl.value);
    if (!price || price <= 0)
      return showError(priceEl, "Enter battery price.");

    // Wh per km
    const whkm = parseFloat(whkmEl.value || "15");
    if (!whkm || whkm <= 0)
      return showError(whkmEl, "Enter valid Wh/km.");

    // Convert capacity to Wh
    const batteryWh = unitEl.value === "ah" ? cap * voltage : cap;

    // Total lifetime energy output
    const totalWh = batteryWh * cycles;

    // Total lifetime distance
    const totalKm = totalWh / whkm;
    const totalMiles = totalKm * 0.621371;

    // Cost per km
    const costPerKm = price / totalKm;

    // Cost per cycle
    const costPerCycle = price / cycles;

    // Lifespan in years/months
    const years = cycles / 365;
    const months = cycles / 30;

    // Output
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Cost per km:</strong> ${costPerKm.toFixed(4)} </h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Total Lifetime Range:</strong> ${totalKm.toFixed(0)} km (${totalMiles.toFixed(0)} miles)</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Total Energy Before Replacement:</strong> ${totalWh.toLocaleString()} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Cost per Full Cycle:</strong> ${costPerCycle.toFixed(2)}</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Estimated Battery Life:</strong> ${years.toFixed(2)} years (${months.toFixed(1)} months)</p>`);
    lines.push(`<p class="small fade-left ad5">Based on ${batteryWh} Wh battery, ${cycles} cycles, and ${whkm} Wh/km consumption.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    cyclesEl.value = "";
    priceEl.value = "";
    whkmEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();











// eBIKE TORQUE CALCULATOR
(function () {
  const root = document.getElementById('torque_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const powerEl   = $('tc_power');
  const voltageEl = $('tc_voltage');
  const kvEl      = $('tc_kv');
  const gearEl    = $('tc_gear');
  const wheelEl   = $('tc_wheel');
  const loadEl    = $('tc_load');
  const resultWrap = $('tc_result');
  const breakdown  = $('tc_breakdown');
  const calcBtn    = $('tc_calculate');
  const resetBtn   = $('tc_reset');

  // Allow numbers + decimal only
  root.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const power = parseFloat(powerEl.value);
    if (!power || power <= 0) return showError(powerEl, "Enter valid power.");

    const voltage = parseFloat(voltageEl.value);
    if (!voltage || voltage <= 0) return showError(voltageEl, "Enter valid voltage.");

    const kv = parseFloat(kvEl.value);
    if (!kv || kv <= 0) return showError(kvEl, "Enter valid motor KV.");

    const gear = parseFloat(gearEl.value);
    if (!gear || gear <= 0) return showError(gearEl, "Enter valid gear ratio.");

    const wheel = parseFloat(wheelEl.value);
    if (!wheel || wheel <= 0) return showError(wheelEl, "Enter wheel size.");

    const weight = parseFloat(loadEl.value);
    if (!weight || weight <= 0) return showError(loadEl, "Enter valid weight.");

    // Convert wheel to meters
    const wheelRadius = (wheel * 0.0254) / 2;

    // Motor RPM
    const motorRPM = kv * voltage;

    // Motor Torque Formula
    // Torque = (60 × Power) / (2π × RPM)
    const motorTorque = (60 * power) / (2 * Math.PI * motorRPM);

    // Torque at Wheel (after gear reduction & 85% efficiency)
    const wheelTorque = motorTorque * gear * 0.85;

    // Force at wheel
    const wheelForce = wheelTorque / wheelRadius;

    // Acceleration (F = ma)
    const acceleration = wheelForce / (weight * 9.81);

    // Max hill climb grade
    const hillPct = (wheelForce / (weight * 9.81)) * 100;

    // Output
    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Wheel Torque:</strong> ${wheelTorque.toFixed(2)} Nm</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Motor Torque:</strong> ${motorTorque.toFixed(2)} Nm</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Wheel Force:</strong> ${wheelForce.toFixed(1)} N</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Acceleration:</strong> ${(acceleration).toFixed(3)} g</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Estimated Climb Ability:</strong> ${hillPct.toFixed(1)}% grade</p>`);
    lines.push(`<p class="small fade-left ad5">Based on KV = ${kv}, gear ratio = ${gear}, and ${wheel}&quot; wheel.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    powerEl.value = "";
    voltageEl.value = "";
    kvEl.value = "";
    gearEl.value = "";
    wheelEl.value = "";
    loadEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();













// MAX LOAD & CARRYING CAPACITY ESTIMATOR
(function () {
  const root = document.getElementById('load_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const powerEl = $('lc_power');
  const voltageEl = $('lc_voltage');
  const wheelEl   = $('lc_wheel');
  const riderEl   = $('lc_rider');
  const bikeEl    = $('lc_bike');

  const resultWrap = $('lc_result');
  const breakdown  = $('lc_breakdown');
  const calcBtn    = $('lc_calculate');
  const resetBtn   = $('lc_reset');

  // Only numbers + decimal
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // Physics constants
  const g = 9.81; // gravity
  const safeTorqueLimit = 160; // Nm (typical hub motor thermal limit)

  function calculate() {
    clearErrors();

    const power   = parseFloat(powerEl.value);
    const voltage = parseFloat(voltageEl.value);
    const wheel   = parseFloat(wheelEl.value);
    const rider   = parseFloat(riderEl.value);
    const bike    = parseFloat(bikeEl.value);

    if (!power || power <= 0) return showError(powerEl, "Enter valid power.");
    if (!voltage || voltage <= 0) return showError(voltageEl, "Enter valid voltage.");
    if (!wheel || wheel <= 0) return showError(wheelEl, "Enter valid wheel size.");
    if (!rider || rider <= 0) return showError(riderEl, "Enter rider weight.");
    if (!bike || bike <= 0) return showError(bikeEl, "Enter bike weight.");

    // Convert wheel size to radius
    const wheelRadius = (wheel * 0.0254) / 2;

    // Estimate torque using simple motor model (average hub motor)
    // Torque ≈ (Power / Speed)
    // Speed approx: wheel circumference × 40 km/h / lower torque loads
    const approxRPM = (40 * 1000) / (Math.PI * wheel * 0.0254) * 60 / 1000;
    const motorTorque = (power * 60) / (2 * Math.PI * approxRPM);

    // Wheel torque ~ motor torque × 0.8 efficiency
    const wheelTorque = motorTorque * 0.8;

    // Force at wheel
    const wheelForce = wheelTorque / wheelRadius;

    // Maximum load supported until torque is insufficient
    const maxLoad = wheelForce / g;

    // Add bike weight to get total
    const maxTotalLoad = maxLoad + bike;

    // Rider + cargo limit
    const maxCargo = maxTotalLoad - rider;

    // Range penalty: heavier weight reduces efficiency
    const totalWeight = rider + bike;
    const loadPenaltyPercent = (maxCargo / totalWeight) * 12; // dynamic factor

    const safeCargo = Math.max(0, maxCargo * 0.75); // 75% safety factor

    // Results
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Max Safe Total Load:</strong> ${maxTotalLoad.toFixed(0)} kg</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Max Cargo Capacity:</strong> ${maxCargo.toFixed(0)} kg</h3>`);
    lines.push(`<h3 class="fade-left ad2"><strong>Recommended Safe Cargo:</strong> ${safeCargo.toFixed(0)} kg</h3>`);

    lines.push(`<p class="fade-left ad3"><strong>Wheel Torque:</strong> ${wheelTorque.toFixed(2)} Nm</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Estimated Wheel Force:</strong> ${wheelForce.toFixed(1)} N</p>`);

    lines.push(`<p class="fade-left ad5"><strong>Range Reduction:</strong> ${loadPenaltyPercent.toFixed(1)}% (when fully loaded)</p>`);

    lines.push(`<p class="small fade-left ad6">Based on ${power}W motor, ${wheel}&quot; wheel, and ${voltage}V system.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    powerEl.value = "";
    voltageEl.value = "";
    wheelEl.value = "";
    riderEl.value = "";
    bikeEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();













// eBIKE HILL CLIMB CALCULATOR
(function () {
  const root = document.getElementById('hill_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const powerEl = $('hc_power');
  const weightEl = $('hc_weight');
  const wheelEl = $('hc_wheel');
  const effEl = $('hc_efficiency');
  const slopeEl = $('hc_slope');

  const resultWrap = $('hc_result');
  const breakdown  = $('hc_breakdown');
  const calcBtn    = $('hc_calculate');
  const resetBtn   = $('hc_reset');

  // Allow numbers + decimal only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  function calculate() {
    clearErrors();

    const power = parseFloat(powerEl.value);
    const weight = parseFloat(weightEl.value);
    const wheel = parseFloat(wheelEl.value);
    const eff = parseFloat(effEl.value);
    const slopeInput = parseFloat(slopeEl.value);

    if (!power || power <= 0) return showError(powerEl, "Enter valid power.");
    if (!weight || weight <= 0) return showError(weightEl, "Enter valid weight.");
    if (!wheel || wheel <= 0) return showError(wheelEl, "Enter valid wheel size.");
    if (!eff || eff <= 0 || eff > 100) return showError(effEl, "Enter valid efficiency.");

    // Physics constants
    const g = 9.81;
    const efficiency = eff / 100;
    const wheelRadius = (wheel * 0.0254) / 2;

    // Maximum wheel force from power:
    // Power = Force * Velocity → Force = Power / Velocity
    // Assume 10 km/h climbing speed for max torque
    const climbSpeedLow = 10 / 3.6; // m/s
    const wheelForce = (power * efficiency) / climbSpeedLow;

    // Max slope the force can support:
    // F_uphill = m*g*sin(theta)
    // sin(theta) = F / (m*g)
    const sinTheta = wheelForce / (weight * g);
    const angleDeg = Math.asin(Math.min(1, sinTheta)) * (180 / Math.PI);
    const maxSlopePct = Math.tan(angleDeg * Math.PI/180) * 100;

    let slopeCheckResult = "";
    let hillSpeed = "";

    if (slopeInput) {
      const theta = Math.atan(slopeInput / 100);
      const requiredForce = weight * g * Math.sin(theta);
      const available = wheelForce;

      if (available >= requiredForce) {
        // Hill speed = P / F
        const speedClimb = power * efficiency / requiredForce;
        hillSpeed = speedClimb * 3.6;

        slopeCheckResult = `<p class="fade-left ad3"><strong>You CAN climb ${slopeInput}% hill</strong> at approx <strong>${hillSpeed.toFixed(1)} km/h</strong>.</p>`;
      } else {
        slopeCheckResult = `<p class="fade-left ad1"><strong>You CANNOT climb ${slopeInput}% hill.</strong> Not enough motor force.</p>`;
      }
    }

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Maximum Climbable Slope:</strong> ${maxSlopePct.toFixed(1)}%</h2>`);
    lines.push(`<h3 class="fade-left ad2"><strong>Maximum Hill Angle:</strong> ${angleDeg.toFixed(1)}°</h3>`);

    if (slopeCheckResult) lines.push(slopeCheckResult);

    lines.push(`<p class="fade-left ad4"><strong>Available Wheel Force:</strong> ${wheelForce.toFixed(1)} N</p>`);
    lines.push(`<p class="small fade-left ad5">Based on ${power}W power, ${wheel}&quot; wheel, and ${eff}% drivetrain efficiency.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    powerEl.value = "";
    weightEl.value = "";
    wheelEl.value = "";
    effEl.value = "";
    slopeEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();











// EFFICIENCY LOSS CALCULATOR
(function () {
  const root = document.getElementById('efficiency_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const idealEl = $('ec_ideal');
  const actualEl = $('ec_actual');
  const capacityEl = $('ec_capacity');
  const unitEl = $('ec_unit');
  const voltageWrap = $('ec_voltage_wrap');
  const voltageEl = $('ec_voltage');
  
  const resultWrap = $('ec_result');
  const breakdown  = $('ec_breakdown');
  const calcBtn    = $('ec_calculate');
  const resetBtn   = $('ec_reset');

  // Allow numbers + decimals only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  // Toggle voltage based on unit
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const ideal = parseFloat(idealEl.value);
    if (!ideal || ideal <= 0) return showError(idealEl, "Enter valid ideal Wh/km.");

    const actual = parseFloat(actualEl.value);
    if (!actual || actual <= 0) return showError(actualEl, "Enter valid actual Wh/km.");

    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0) return showError(capacityEl, "Enter valid battery capacity.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0)
        return showError(voltageEl, "Enter valid voltage.");
    }

    // Convert battery to Wh
    const batteryWh = (unitEl.value === "ah") ? cap * voltage : cap;

    // Efficiency calculation
    const efficiency = (ideal / actual) * 100;
    const lossPercent = 100 - efficiency;

    // Loss per km
    const lossWhPerKm = actual - ideal;

    // Range
    const idealRange = batteryWh / ideal;
    const actualRange = batteryWh / actual;

    const rangeLossPercent = ((idealRange - actualRange) / idealRange) * 100;

    // Estimated loss reasons (approximate model)
    const rolling = lossPercent * 0.30;
    const drivetrain = lossPercent * 0.20;
    const wind = lossPercent * 0.40;
    const misc = lossPercent * 0.10;

    // Build output
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Efficiency:</strong> ${efficiency.toFixed(1)}%</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Total Energy Loss:</strong> ${lossPercent.toFixed(1)}%</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Lost Energy per km:</strong> ${lossWhPerKm.toFixed(2)} Wh</p>`);

    lines.push(`<p class="fade-left ad3"><strong>Ideal Range:</strong> ${idealRange.toFixed(1)} km</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Actual Range:</strong> ${actualRange.toFixed(1)} km</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Range Reduction:</strong> ${rangeLossPercent.toFixed(1)}%</p>`);

    lines.push(`<h3 class="fade-left ad6">Loss Breakdown</h3>`);
    lines.push(`<p class="fade-left ad7">Rolling Resistance: ${rolling.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad8">Drivetrain Loss: ${drivetrain.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad9">Wind Drag: ${wind.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad10">Other Losses: ${misc.toFixed(1)}%</p>`);

    lines.push(`<p class="small fade-left ad11">Based on ${batteryWh} Wh battery and Wh/km comparison.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    idealEl.value = "";
    actualEl.value = "";
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();












// DEPTH OF DISCHARGE (DoD) IMPACT CALCULATOR
(function () {
  const root = document.getElementById('dod_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const cyclesEl = $('dod_cycles');
  const capacityEl = $('dod_capacity');
  const unitEl     = $('dod_unit');
  const voltageWrap = $('dod_voltage_wrap');
  const voltageEl   = $('dod_voltage');
  const dodEl       = $('dod_percent');

  const resultWrap = $('dod_result');
  const breakdown  = $('dod_breakdown');
  const calcBtn    = $('dod_calculate');
  const resetBtn   = $('dod_reset');

  // Allow numbers + decimal only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, '');
      const p = v.split('.');
      if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
      inp.value = v;
    });
  });

  // Toggle voltage
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }


  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const ratedCycles = parseFloat(cyclesEl.value);
    if (!ratedCycles || ratedCycles <= 0)
      return showError(cyclesEl, "Enter valid cycle rating.");

    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0)
      return showError(capacityEl, "Enter valid battery capacity.");

    const dod = parseFloat(dodEl.value);
    if (!dod || dod <= 0 || dod > 100)
      return showError(dodEl, "Enter DoD between 1 and 100.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0)
        return showError(voltageEl, "Enter valid voltage.");
    }

    // Battery wh
    const batteryWh = (unitEl.value === "ah") ? cap * voltage : cap;

    // DoD Cycle Life Model (empirical lithium model)
    // Typical Li-ion relationship:
    // 100% DoD → 500 cycles
    // 80% DoD  → 800–1000 cycles (1.6–2x)
    // 50% DoD  → 1500–2000 cycles (3–4x)

    const baseDoD = 100;
    const dodFactor = Math.pow(baseDoD / dod, 0.7); // empirical exponent
    const estimatedCycles = ratedCycles * dodFactor;

    // Lifetime energy
    const lifetimeWh = estimatedCycles * batteryWh;

    // Battery years (1 full cycle/day)
    const years = estimatedCycles / 365;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Estimated Cycle Life:</strong> ${estimatedCycles.toFixed(0)} cycles</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Battery Lifespan:</strong> ${years.toFixed(2)} years</h3>`);

    const increasePct = ((estimatedCycles - ratedCycles) / ratedCycles) * 100;
    lines.push(`<p class="fade-left ad2"><strong>Life Increase:</strong> ${increasePct.toFixed(1)}% compared to 100% DoD</p>`);

    lines.push(`<p class="fade-left ad3"><strong>Total Usable Energy Over Lifetime:</strong> ${lifetimeWh.toLocaleString()} Wh</p>`);

    lines.push(`<p class="fade-left ad4"><strong>Recommended Optimal DoD:</strong> 20%–80% for best life</p>`);
    
    lines.push(`<p class="small fade-left ad5">Based on ${batteryWh} Wh battery and ${ratedCycles} rated cycles.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }


  function resetForm() {
    cyclesEl.value = "";
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    dodEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();













// BATTERY TEMPERATURE IMPACT CALCULATOR
(function () {
  const root = document.getElementById('temp_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const cyclesEl = $('temp_cycles');
  const capacityEl = $('temp_capacity');
  const unitEl = $('temp_unit');
  const voltageWrap = $('temp_voltage_wrap');
  const voltageEl = $('temp_voltage');
  const tempEl = $('temp_celsius');

  const resultWrap = $('temp_result');
  const breakdown = $('temp_breakdown');
  const calcBtn = $('temp_calculate');
  const resetBtn = $('temp_reset');

  // Number-only inputs
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Toggle voltage field
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const ratedCycles = parseFloat(cyclesEl.value);
    if (!ratedCycles || ratedCycles <= 0)
      return showError(cyclesEl, "Enter valid cycle rating.");

    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0)
      return showError(capacityEl, "Enter valid battery capacity.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0)
        return showError(voltageEl, "Enter valid voltage.");
    }

    const tempC = parseFloat(tempEl.value);
    if (isNaN(tempC))
      return showError(tempEl, "Enter a valid temperature.");
    
    // Convert capacity to Wh
    const batteryWh = (unitEl.value === "ah") ? cap * voltage : cap;

    // Temperature Baseline = 25°C
    const baseline = 25;

    // Arrhenius degradation model:
    // Every +10°C = ~2x faster aging
    const accelFactor = Math.pow(2, (tempC - baseline) / 10);

    // New cycle life
    const estimatedCycles = ratedCycles / accelFactor;

    // Lifetime energy output
    const lifetimeWh = batteryWh * estimatedCycles;

    const lossPct = ((ratedCycles - estimatedCycles) / ratedCycles) * 100;

    const years = estimatedCycles / 365;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Adjusted Cycle Life:</strong> ${estimatedCycles.toFixed(0)} cycles</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Battery Lifespan:</strong> ${years.toFixed(2)} years</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Life Lost Due to Temperature:</strong> ${lossPct.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Acceleration Factor:</strong> ${accelFactor.toFixed(2)}x faster aging</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Total Energy Over Lifetime:</strong> ${lifetimeWh.toLocaleString()} Wh</p>`);
    lines.push(`<p class="small fade-left ad5">Based on ${batteryWh} Wh battery at ${tempC}°C.</p>`);
    lines.push(`<p class="small fade-left ad6"><strong>Recommended Temperature:</strong> 10–30°C for long battery life.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    cyclesEl.value = "";
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    tempEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();












// BATTERY CHARGING COST PER MONTH CALCULATOR
(function () {
  const root = document.getElementById('monthly_cost_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const capacityEl = $('mcc_capacity');
  const unitEl = $('mcc_unit');
  const voltageWrap = $('mcc_voltage_wrap');
  const voltageEl = $('mcc_voltage');
  const priceEl = $('mcc_price');
  const usageEl = $('mcc_daily_usage');

  const resultWrap = $('mcc_result');
  const breakdown = $('mcc_breakdown');
  const calcBtn = $('mcc_calculate');
  const resetBtn = $('mcc_reset');

  // number-only inputs
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Show voltage if Ah
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const capacity = parseFloat(capacityEl.value);
    if (!capacity || capacity <= 0)
      return showError(capacityEl, "Enter valid battery capacity.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0)
        return showError(voltageEl, "Enter valid voltage.");
    }

    const price = parseFloat(priceEl.value);
    if (!price || price <= 0)
      return showError(priceEl, "Enter valid electricity price per kWh.");

    const dailyUsage = parseFloat(usageEl.value || "0");

    // Convert battery to Wh
    const batteryWh = unitEl.value === "ah" ? capacity * voltage : capacity;

    // cost per full charge
    const chargeCost = (batteryWh / 1000) * price;

    // if daily usage entered, calculate daily cost else assume full charge
    const dailyWh = dailyUsage || batteryWh;
    const dailyCost = (dailyWh / 1000) * price;

    // monthly & yearly
    const monthlyCost = dailyCost * 30;
    const yearlyCost = dailyCost * 365;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Cost per Full Charge:</strong> ${chargeCost.toFixed(2)}</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Daily Charging Cost:</strong> ${dailyCost.toFixed(2)}</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Monthly Charging Cost:</strong> ${monthlyCost.toFixed(2)}</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Yearly Charging Cost:</strong> ${yearlyCost.toFixed(2)}</p>`);
    lines.push(`<p class="small fade-left ad4">Battery size: ${batteryWh} Wh | Electricity price: ${price} per kWh</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    priceEl.value = "";
    usageEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();











// BATTERY SELF-DISCHARGE CALCULATOR
(function () {
  const root = document.getElementById('self_discharge_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const capacityEl = $('sd_capacity');
  const unitEl = $('sd_unit');
  const voltageWrap = $('sd_voltage_wrap');
  const voltageEl = $('sd_voltage');
  const rateEl = $('sd_rate');
  const daysEl = $('sd_days');

  const resultWrap = $('sd_result');
  const breakdown = $('sd_breakdown');
  const calcBtn = $('sd_calculate');
  const resetBtn = $('sd_reset');

  // Allow number + decimal only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Show voltage if Ah
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helper
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0)
      return showError(capacityEl, "Enter valid battery capacity.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0)
        return showError(voltageEl, "Enter valid voltage.");
    }

    const rate = parseFloat(rateEl.value);
    if (!rate || rate <= 0)
      return showError(rateEl, "Enter self-discharge rate.");

    const days = parseFloat(daysEl.value);
    if (!days || days <= 0)
      return showError(daysEl, "Enter valid number of days.");

    // Convert to Wh
    const batteryWh = unitEl.value === "ah" ? cap * voltage : cap;

    // Calculate daily self-discharge (compound)
    const monthly = rate / 100;
    const dailyLoss = Math.pow(1 - monthly, 1 / 30) - 1; // decay per day
    const remainingPercent = Math.pow(1 + dailyLoss, days);
    const remainingWh = batteryWh * remainingPercent;

    const lostWh = batteryWh - remainingWh;
    const remainingPctDisp = remainingPercent * 100;

    // Time to reach key levels
    function daysToReach(percent) {
      // percent = remaining%
      const target = percent / 100;
      if (target >= 1) return 0;
      return Math.log(target) / Math.log(1 + dailyLoss);
    }

    const d80 = daysToReach(80);
    const d50 = daysToReach(50);
    const d20 = daysToReach(20);

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Remaining Capacity:</strong> ${remainingWh.toFixed(2)} Wh (${remainingPctDisp.toFixed(1)}%)</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Energy Lost:</strong> ${lostWh.toFixed(2)} Wh</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Time to reach 80%:</strong> ${d80.toFixed(0)} days</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Time to reach 50%:</strong> ${d50.toFixed(0)} days</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Time to reach 20%:</strong> ${d20.toFixed(0)} days</p>`);

    lines.push(`<p class="small fade-left ad5">Based on ${batteryWh} Wh battery stored for ${days} days at ${rate}% per month self-discharge.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    rateEl.value = "";
    daysEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();












// BATTERY CALENDAR AGING & LIFE ESTIMATOR
(function () {
  const root = document.getElementById('calendar_aging_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const capacityEl = $('ca_capacity');
  const unitEl = $('ca_unit');
  const voltageWrap = $('ca_voltage_wrap');
  const voltageEl = $('ca_voltage');
  const yearsEl = $('ca_years');
  const tempEl = $('ca_temp');
  const socEl = $('ca_soc');

  const resultWrap = $('ca_result');
  const breakdown = $('ca_breakdown');
  const calcBtn = $('ca_calculate');
  const resetBtn = $('ca_reset');

  // number only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // toggle voltage
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll('.error-message').forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0) return showError(capacityEl, "Enter valid capacity.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0) return showError(voltageEl, "Enter valid voltage.");
    }

    const years = parseFloat(yearsEl.value);
    if (!years || years <= 0) return showError(yearsEl, "Enter valid years.");

    const temp = parseFloat(tempEl.value);
    if (isNaN(temp)) return showError(tempEl, "Enter valid temperature.");

    const soc = parseFloat(socEl.value);
    if (!soc || soc <= 0 || soc > 100) return showError(socEl, "Invalid SoC percentage.");

    // Convert to Wh
    const batteryWh = unitEl.value === "ah" ? cap * voltage : cap;

    // CALENDAR AGING MODEL
    // Reference aging: ~3% capacity loss per year at 25°C, 50% SOC
    let baseLoss = 0.03;

    // Temperature effect (Arrhenius)
    // +10°C = ~2x faster aging
    const tempFactor = Math.pow(2, (temp - 25) / 10);

    // SOC stress effect
    // Higher SOC increases aging drastically
    let socFactor = 1;
    if (soc > 80) socFactor = 1.8;
    else if (soc > 60) socFactor = 1.4;
    else if (soc > 40) socFactor = 1.0;
    else socFactor = 0.8;

    const annualLoss = baseLoss * tempFactor * socFactor;  
    const remainingCapacityPct = Math.pow(1 - annualLoss, years) * 100;
    const totalLossPct = 100 - remainingCapacityPct;

    const remainingWh = batteryWh * (remainingCapacityPct / 100);

    const accelFactor = tempFactor * socFactor;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Remaining Capacity:</strong> ${remainingCapacityPct.toFixed(1)}%</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Total Loss After ${years} Years:</strong> ${totalLossPct.toFixed(1)}%</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Remaining Energy:</strong> ${remainingWh.toFixed(2)} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Aging Acceleration:</strong> ${accelFactor.toFixed(2)}× faster than ideal</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Annual Calendar Aging:</strong> ${(annualLoss * 100).toFixed(2)}% per year</p>`);

    lines.push(`
      <p class="small fade-left ad5">
      Best storage: 40–60% SoC at 15–25°C.  
      Higher temperature and higher charge % cause faster chemical breakdown.
      </p>
    `);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    yearsEl.value = "";
    tempEl.value = "";
    socEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();
 









// SOLAR CHARGING POWER CALCULATOR
(function () {
  const root = document.getElementById('solar_charging_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const capacityEl = $('sc_capacity');
  const unitEl = $('sc_unit');
  const voltageWrap = $('sc_voltage_wrap');
  const voltageEl = $('sc_voltage');
  const panelPowerEl = $('sc_panel_power');
  const sunHoursEl = $('sc_sun_hours');
  const efficiencyEl = $('sc_efficiency');

  const resultWrap = $('sc_result');
  const breakdown = $('sc_breakdown');
  const calcBtn = $('sc_calculate');
  const resetBtn = $('sc_reset');

  // Number + decimal only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Toggle voltage
  function toggleVoltage() {
    voltageWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const cap = parseFloat(capacityEl.value);
    if (!cap || cap <= 0) return showError(capacityEl, "Enter valid battery capacity.");

    let voltage = 48;
    if (unitEl.value === "ah") {
      voltage = parseFloat(voltageEl.value || "48");
      if (!voltage || voltage <= 0) return showError(voltageEl, "Enter valid voltage.");
    }

    const panelPower = parseFloat(panelPowerEl.value);
    if (!panelPower || panelPower <= 0)
      return showError(panelPowerEl, "Enter valid solar panel watt rating.");

    const sunHours = parseFloat(sunHoursEl.value);
    if (!sunHours || sunHours <= 0)
      return showError(sunHoursEl, "Enter valid sunlight hours.");

    const efficiency = parseFloat(efficiencyEl.value);
    if (!efficiency || efficiency <= 0 || efficiency > 100)
      return showError(efficiencyEl, "Enter 1–100% efficiency.");

    // Convert to Wh
    const batteryWh = (unitEl.value === "ah") ? cap * voltage : cap;

    // Actual usable solar output (W × efficiency)
    const usablePower = panelPower * (efficiency / 100);

    // Daily solar energy generation
    const dailyWh = usablePower * sunHours;

    // Charging time in hours
    const hoursNeeded = batteryWh / usablePower;

    // Days needed using daily sunlight
    const daysNeeded = batteryWh / dailyWh;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Solar Charging Time:</strong> ${hoursNeeded.toFixed(2)} hours</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Days Needed (with sunlight):</strong> ${daysNeeded.toFixed(2)} days</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Usable Solar Power:</strong> ${usablePower.toFixed(2)} W</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Daily Solar Production:</strong> ${dailyWh.toFixed(2)} Wh/day</p>`);
    lines.push(`<p class="small fade-left ad4">Based on ${panelPower}W panel, ${sunHours}h sunlight and ${efficiency}% efficiency.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // RESET
  function resetForm() {
    capacityEl.value = "";
    unitEl.value = "ah";
    voltageEl.value = "";
    panelPowerEl.value = "";
    sunHoursEl.value = "";
    efficiencyEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();











// EBIKE INSURANCE COST ESTIMATOR
(function () {
  const root = document.getElementById('insurance_cost_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const bikeValueEl = $('ic_bike_value');
  const theftEl = $('ic_theft');
  const accidentEl = $('ic_accident');
  const baseRateEl = $('ic_base_rate');

  const resultWrap = $('ic_result');
  const breakdown = $('ic_breakdown');

  const calcBtn = $('ic_calculate');
  const resetBtn = $('ic_reset');

  // Allow number + decimal only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error message handler
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }

  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    const value = parseFloat(bikeValueEl.value);
    if (!value || value <= 0)
      return showError(bikeValueEl, "Enter valid eBike value.");

    const theft = parseFloat(theftEl.value);
    if (!theft || theft < 0)
      return showError(theftEl, "Enter valid theft risk.");

    const accident = parseFloat(accidentEl.value);
    if (!accident || accident < 0)
      return showError(accidentEl, "Enter valid accident risk.");

    const baseRate = parseFloat(baseRateEl.value);
    if (!baseRate || baseRate < 0)
      return showError(baseRateEl, "Enter valid base insurance rate.");

    // Convert percentages to decimal
    const baseCost = value * (baseRate / 100);
    const theftCost = value * (theft / 100);
    const accidentCost = value * (accident / 100);

    const annualCost = baseCost + theftCost + accidentCost;
    const monthlyCost = annualCost / 12;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Estimated Annual Insurance Cost:</strong> ${annualCost.toFixed(2)}</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Monthly Cost:</strong> ${monthlyCost.toFixed(2)}</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Base Insurance Cost:</strong> ${baseCost.toFixed(2)}</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Theft Risk Added:</strong> ${theftCost.toFixed(2)}</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Accident Risk Added:</strong> ${accidentCost.toFixed(2)}</p>`);
    lines.push(`<p class="small fade-left ad5">These values are estimates based on user inputs and general risk factors.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // RESET
  function resetForm() {
    bikeValueEl.value = "";
    theftEl.value = "";
    accidentEl.value = "";
    baseRateEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();










// EBIKE BATTERY UPGRADE COMPATIBILITY CHECKER
(function () {
  const root = document.getElementById('battery_upgrade_checker');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  const oldV = $('uc_old_voltage');
  const newV = $('uc_new_voltage');
  const ctrlV = $('uc_controller_voltage');
  const motorV = $('uc_motor_voltage');
  const bmsA = $('uc_bms_current');
  const ctrlA = $('uc_controller_current');

  const calcBtn = $('uc_check');
  const resetBtn = $('uc_reset');

  const resultWrap = $('uc_result');
  const breakdown = $('uc_breakdown');

  // Decimal-friendly input
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error messages
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
    }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // MAIN LOGIC
  function checkCompatibility() {
    clearErrors();

    const ov = parseFloat(oldV.value);
    if (!ov || ov <= 0) return showError(oldV, "Enter valid old voltage.");

    const nv = parseFloat(newV.value);
    if (!nv || nv <= 0) return showError(newV, "Enter valid new voltage.");

    const cv = parseFloat(ctrlV.value);
    if (!cv || cv <= 0) return showError(ctrlV, "Enter controller voltage limit.");

    const mv = parseFloat(motorV.value);
    if (!mv || mv <= 0) return showError(motorV, "Enter motor nominal voltage.");

    const ba = parseFloat(bmsA.value);
    if (!ba || ba <= 0) return showError(bmsA, "Enter battery BMS current.");

    const ca = parseFloat(ctrlA.value);
    if (!ca || ca <= 0) return showError(ctrlA, "Enter controller current draw.");

    // --- RULES ---

    // Rule 1: Controller voltage must support new battery voltage
    const voltageOK = nv <= cv;

    // Rule 2: Motor nominal voltage should be near new voltage (±20%)
    const motorMin = mv * 0.8;
    const motorMax = mv * 1.2;
    const motorOK = nv >= motorMin && nv <= motorMax;

    // Rule 3: Battery BMS current must be >= controller draw
    const currentOK = ba >= ca;

    // Compatibility summary
    let allGood = voltageOK && motorOK && currentOK;

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Compatibility Result:</strong> ${allGood ? "Compatible ✔" : "Not Compatible ✖"}</h2>`);

    lines.push(`<h3 class="fade-left ad1">Voltage Check:</h3>
      <p class="fade-left ad2">${voltageOK ? "✔ Controller supports new voltage" : "✖ New voltage exceeds controller limit"}</p>`);

    lines.push(`<h3 class="fade-left ad3">Motor Compatibility:</h3>
      <p class="fade-left ad4">${motorOK ? "✔ Motor can run within safe voltage range" : "✖ New voltage is unsafe for motor"}</p>`);

    lines.push(`<h3 class="fade-left ad5">Current / BMS Check:</h3>
      <p class="fade-left ad6">${currentOK ? "✔ BMS can handle controller current" : "✖ Controller current exceeds BMS capability"}</p>`);

    lines.push(`<p class="small fade-left ad7">Ideal upgrade: Controller max V ≥ New battery V, Motor voltage within ±20%, BMS current ≥ Controller current.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // RESET
  function resetForm() {
    oldV.value = "";
    newV.value = "";
    ctrlV.value = "";
    motorV.value = "";
    bmsA.value = "";
    ctrlA.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", checkCompatibility);
  resetBtn.addEventListener("click", resetForm);
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










// Responsive Menu CSS
document.querySelector('.navbar-toggler').addEventListener('click', function() {
  const nav = document.querySelector('.main-nav');
  nav.classList.toggle('active');
});
document.querySelectorAll('.dropdown-menu > a').forEach(function(dropdown) {
  dropdown.addEventListener('click', function(e) {
    const submenu = dropdown.nextElementSibling;
    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
  });
});




















}); // end DOMContentLoaded wrapper











