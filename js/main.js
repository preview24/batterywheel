
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
    lines.push(`<h2 class="fade-left main-result ad1"><strong>Electricity Cost per 100 km:</strong> ${costPer100.toFixed(2)} ${getCurrencySymbol(cost)} </h2>`);
    lines.push(`<p class="f12 fade-left ad2"><strong>Cost per Full Charge:</strong> ${fullChargeCost.toFixed(2)} ${getCurrencySymbol(cost)}</p>`);
    lines.push(`<p class="f12 fade-left ad3"><strong>Battery Energy:</strong> ${batteryKWh.toFixed(2)} kWh</p>`);
    lines.push(`<p class="f12 fade-left ad4"><strong>Range per Charge:</strong> ${range.toFixed(1)} km</p>`);
    lines.push(`<p class="f12 fade-left ad5"><span class="small">Assuming full discharge and recharge each cycle. Actual cost may vary due to charger efficiency and terrain.</span></p>`);
    breakdown.innerHTML=lines.join('');
  }

  function getCurrencySymbol(cost){
    // naive auto symbol — optional, you can remove if not desired
    if(cost>50) return '৳'; // likely Bangladeshi Taka
    return '$';
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










