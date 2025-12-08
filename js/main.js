// SAFETY WRAPPER — prevents calculators from breaking on missing HTML
function safeRun(callback) {
    try {
        callback();
    } catch (e) {
        // console.log("Calculator skipped:", e);
    }
}





// Range Calculator
safeRun(function () {
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

});







 // Charging Cost Calculator


// Charging Cost Calculator (with decimal-safe input + reset + formatted result)
safeRun(function() {
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
        breakdown.push(`<h2 class="fade-left main-result">Total Charging Cost: &nbsp;  ${totalCost.toFixed(2)} </h2>`);
        breakdown.push(`<p class="f12 fade-left ad1"><strong>Battery:</strong> ${batteryKWh.toFixed(2)} kWh </p>`);
        breakdown.push(`<p class="f12 fade-left ad2"><strong>Current Charge:</strong> ${charge}% </p>`);
        breakdown.push(`<p class="f12 fade-left ad3"><strong>Energy Needed:</strong> ${requiredCharge.toFixed(2)} kWh </p>`);
        breakdown.push(`<p class="f12 fade-left ad4"><strong>Cost per kWh:</strong> ${cost.toFixed(2)} </p>`);

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
});









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










// REGENERATIVE BRAKING SAVINGS CALCULATOR
(function () {
  const root = document.getElementById("regen_brake_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  // Inputs
  const vEl = $("rg_voltage");
  const capEl = $("rg_capacity");
  const wEl = $("rg_weight");
  const spEl = $("rg_speed");
  const stEl = $("rg_stops");
  const efEl = $("rg_eff");

  const calcBtn = $("rg_calc");
  const resetBtn = $("rg_reset");
  const resultWrap = $("rg_result");
  const breakdown = $("rg_breakdown");

  // Decimal filtering
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error handling
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const V = parseFloat(vEl.value);
    if (!V || V <= 0) return showError(vEl, "Enter valid voltage.");

    const capWh = parseFloat(capEl.value);
    if (!capWh || capWh <= 0) return showError(capEl, "Enter valid capacity.");

    const weight = parseFloat(wEl.value);
    if (!weight || weight <= 0) return showError(wEl, "Enter valid total weight.");

    const speed = parseFloat(spEl.value);
    if (!speed || speed <= 0) return showError(spEl, "Enter valid speed.");

    const stops = parseFloat(stEl.value);
    if (!stops || stops <= 0) return showError(stEl, "Enter number of stops.");

    const eff = parseFloat(efEl.value);
    if (!eff || eff <= 0) return showError(efEl, "Enter regen efficiency.");

    // Kinetic Energy: KE = 0.5 * m * v^2
    // Convert speed km/h → m/s
    const speedMS = speed / 3.6;
    const KE = 0.5 * weight * speedMS * speedMS; // Joules

    // Convert Joules → Wh : 1 Wh = 3600 J
    const KE_Wh = KE / 3600;

    // Energy recovered per stop
    const recoveredPerStop = KE_Wh * (eff / 100);

    // Total recovered per trip
    const totalRecovered = recoveredPerStop * stops;

    // Extra range gained (assuming 15 Wh/km typical usage)
    const whPerKm = 15;
    const extraRange = totalRecovered / whPerKm;

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Regen Savings Summary</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Energy recovered per stop:</strong> ${recoveredPerStop.toFixed(3)} Wh</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Total energy recovered per trip:</strong> ${totalRecovered.toFixed(2)} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Extra range gained:</strong> ${extraRange.toFixed(2)} km</p>`);
    lines.push(`<p class="small fade-left ad4">Assuming typical eBike consumption of ${whPerKm} Wh per km.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    vEl.value = "";
    capEl.value = "";
    wEl.value = "";
    spEl.value = "";
    stEl.value = "";
    efEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();










// BATTERY REPLACEMENT TIME PREDICTOR
(function () {
  const root = document.getElementById("battery_replacement_predictor");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capEl = $("br_capacity");
  const cyclesEl = $("br_cycles");
  const dailyEl = $("br_daily");
  const ageEl = $("br_age");
  const thresholdEl = $("br_threshold");

  const calcBtn = $("br_calc");
  const resetBtn = $("br_reset");

  const resultWrap = $("br_result");
  const breakdown = $("br_breakdown");

  // Allow numbers + decimals only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error handling
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const cap = parseFloat(capEl.value);
    if (!cap || cap <= 0) return showError(capEl, "Enter valid battery capacity.");

    const ratedCycles = parseFloat(cyclesEl.value);
    if (!ratedCycles || ratedCycles <= 0) return showError(cyclesEl, "Enter valid rated cycles.");

    const dailyWh = parseFloat(dailyEl.value);
    if (!dailyWh || dailyWh <= 0) return showError(dailyEl, "Enter valid daily usage.");

    const ageMonths = parseFloat(ageEl.value);
    if (!ageMonths || ageMonths < 0) return showError(ageEl, "Enter valid battery age.");

    const threshold = parseFloat(thresholdEl.value);
    if (!threshold || threshold <= 0 || threshold > 100)
      return showError(thresholdEl, "Enter a threshold between 1 and 100.");

    // === CALCULATE USED CYCLES ===
    const dailyCyclesUsed = dailyWh / cap; // fractional cycles per day
    const totalCyclesUsed = dailyCyclesUsed * 30 * ageMonths;

    // === TARGET CYCLES UNTIL REPLACEMENT ===
    const failCycles = ratedCycles * (threshold / 100);

    const cyclesLeft = failCycles - totalCyclesUsed;

    if (cyclesLeft <= 0) {
      breakdown.innerHTML = `
        <h2 class="fade-left">Your battery has already reached the replacement threshold.</h2>
        <p class="fade-left">Estimated remaining life: 0 months.</p>`;
      resultWrap.hidden = false;
      return;
    }

    // === PREDICT FUTURE LIFE ===
    const daysLeft = cyclesLeft / dailyCyclesUsed;
    const monthsLeft = daysLeft / 30;
    const yearsLeft = monthsLeft / 12;

    // Estimated replacement date
    const now = new Date();
    now.setDate(now.getDate() + daysLeft);
    const repDate = now.toDateString();

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Estimated Time Until Replacement:</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>${yearsLeft.toFixed(2)} years</strong> (${monthsLeft.toFixed(1)} months)</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Days remaining:</strong> ${Math.round(daysLeft)}</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Estimated replacement date:</strong> ${repDate}</p>`);

    lines.push(`<hr>`);

    lines.push(`<p class="fade-left ad4"><strong>Rated cycle life:</strong> ${ratedCycles}</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Cycles used so far:</strong> ${totalCyclesUsed.toFixed(1)}</p>`);
    lines.push(`<p class="fade-left ad6"><strong>Cycles left until threshold:</strong> ${cyclesLeft.toFixed(1)}</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    capEl.value = "";
    cyclesEl.value = "";
    dailyEl.value = "";
    ageEl.value = "";
    thresholdEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();









// BATTERY HEALTH SCORE CALCULATOR (EV STYLE)
(function () {
  const root = document.getElementById("battery_health_score_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capEl = $("bh_capacity");
  const ratedCyclesEl = $("bh_cycles_rated");
  const usedCyclesEl = $("bh_cycles_used");
  const ageEl = $("bh_age");
  const dodEl = $("bh_dod");
  const tempEl = $("bh_temp");

  const calcBtn = $("bh_calc");
  const resetBtn = $("bh_reset");
  const resultWrap = $("bh_result");
  const breakdown = $("bh_breakdown");

  // Allow only decimal numbers
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Errors
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const cap = parseFloat(capEl.value);
    if (!cap || cap <= 0) return showError(capEl, "Enter valid battery capacity.");

    const ratedCycles = parseFloat(ratedCyclesEl.value);
    if (!ratedCycles || ratedCycles <= 0) return showError(ratedCyclesEl, "Enter valid rated cycle life.");

    const usedCycles = parseFloat(usedCyclesEl.value);
    if (!usedCycles || usedCycles < 0) return showError(usedCyclesEl, "Enter valid used cycles.");

    const ageMonths = parseFloat(ageEl.value);
    if (!ageMonths || ageMonths < 0) return showError(ageEl, "Enter valid battery age.");

    const dod = parseFloat(dodEl.value);
    if (!dod || dod < 1 || dod > 100) return showError(dodEl, "Depth of discharge must be 1–100%.");

    const temp = parseFloat(tempEl.value);
    if (!temp || temp < -20) return showError(tempEl, "Enter a reasonable temperature.");

    // ===== EV BATTERY HEALTH MODEL =====

    // 1. Cycle aging (loss proportional to used cycles)
    const cycleHealth = 100 * (1 - usedCycles / ratedCycles);

    // 2. Calendar aging (Li-ion loses ~2.5–3% per year)
    const calendarDegrade = (ageMonths / 12) * 3;
    const calendarHealth = 100 - calendarDegrade;

    // 3. DoD penalty (higher DoD = faster aging)
    const dodPenalty = (dod - 20) * 0.15; // 0.15% per % above 20%
    const dodHealth = 100 - Math.max(0, dodPenalty);

    // 4. Temperature stress (above 30°C increases decay)
    let tempPenalty = 0;
    if (temp > 30) tempPenalty = (temp - 30) * 0.8; // 0.8% per °C above 30
    const tempHealth = 100 - tempPenalty;

    // Final health = weighted EV-style average
    const finalHealth =
      (cycleHealth * 0.45 +
       calendarHealth * 0.25 +
       dodHealth * 0.15 +
       tempHealth * 0.15);

    const finalScore = Math.max(0, Math.min(100, finalHealth));

    // Estimate remaining useful life (RUL)
    const yearsUsed = ageMonths / 12;
    const estimatedTotalLife = (yearsUsed / (1 - finalScore / 100));
    const yearsLeft = estimatedTotalLife - yearsUsed;

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Battery Health Score:</strong> ${finalScore.toFixed(1)}%</h2>`);

    lines.push(`<h3 class="fade-left ad1">Health Breakdown</h3>`);
    lines.push(`<p class="fade-left ad2"><strong>Cycle Aging Health:</strong> ${cycleHealth.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Calendar Aging Health:</strong> ${calendarHealth.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad4"><strong>DoD Health:</strong> ${dodHealth.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Temperature Health:</strong> ${tempHealth.toFixed(1)}%</p>`);

    lines.push(`<p class="fade-left ad6"><strong>Estimated Remaining Life:</strong> ${yearsLeft.toFixed(1)} years</p>`);
    lines.push(`<p class="small fade-left ad7">Based on EV-grade lithium battery degradation modeling.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    capEl.value = "";
    ratedCyclesEl.value = "";
    usedCyclesEl.value = "";
    ageEl.value = "";
    dodEl.value = "";
    tempEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();








// EBIKE MOTOR HEAT CALCULATOR
(function () {
  const root = document.getElementById("motor_heat_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const pEl = $("mh_motor_power");
  const loadEl = $("mh_load");
  const resEl = $("mh_resistance");
  const voltEl = $("mh_voltage");
  const airEl = $("mh_airflow");
  const ambEl = $("mh_ambient");

  const calcBtn = $("mh_calc");
  const resetBtn = $("mh_reset");
  const resultWrap = $("mh_result");
  const breakdown = $("mh_breakdown");

  // Decimal-only input



  // Error handler
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const motorPower = parseFloat(pEl.value);
    if (!motorPower || motorPower <= 0)
      return showError(pEl, "Enter valid motor power.");

    const loadPower = parseFloat(loadEl.value);
    if (!loadPower || loadPower <= 0)
      return showError(loadEl, "Enter valid load power.");

    const R = parseFloat(resEl.value);
    if (!R || R <= 0)
      return showError(resEl, "Enter valid resistance.");

    const V = parseFloat(voltEl.value);
    if (!V || V <= 0)
      return showError(voltEl, "Enter valid voltage.");

    const airflow = parseFloat(airEl.value);
    if (!airflow || airflow < 1 || airflow > 10)
      return showError(airEl, "Cooling factor must be 1–10.");

    const ambient = parseFloat(ambEl.value);
    if (ambient < -20 || isNaN(ambient))
      return showError(ambEl, "Enter valid temperature.");

    // ===========================
    //  MOTOR HEATING MODEL
    // ===========================

    // Motor current
    const current = loadPower / V;

    // Power loss = I²R (copper losses)
    const heatLoss = current * current * R; // watts

    // Thermal rise depends on airflow
    const coolingFactor = airflow * 4; // arbitrary scale
    const tempRise = heatLoss / coolingFactor;

    const motorTemp = ambient + tempRise;

    // Risk Level
    let risk = "Safe";
    if (motorTemp > 90) risk = "DANGER (Motor may overheat!)";
    else if (motorTemp > 75) risk = "High Risk";
    else if (motorTemp > 60) risk = "Moderate Heating";

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Motor Temperature:</strong> ${motorTemp.toFixed(1)} °C</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Status:</strong> ${risk}</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Electrical current:</strong> ${current.toFixed(2)} A</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Copper (I²R) heat loss:</strong> ${heatLoss.toFixed(1)} W</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Estimated temperature rise:</strong> ${tempRise.toFixed(1)} °C</p>`);
    lines.push(`<p class="small fade-left ad5">This is a simplified BLDC thermal estimation. Real motors may vary based on winding, ventilation & cooling fins.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    pEl.value = "";
    loadEl.value = "";
    resEl.value = "";
    voltEl.value = "";
    airEl.value = "";
    ambEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();








// VOLTAGE SAG CALCULATOR
(function () {
  const root = document.getElementById("voltage_sag_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const voltageEl = $("vs_voltage");
  const irEl = $("vs_ir");
  const currentEl = $("vs_current");

  const calcBtn = $("vs_calc");
  const resetBtn = $("vs_reset");

  const resultWrap = $("vs_result");
  const breakdown = $("vs_breakdown");

  // Allow decimals
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value;

      v = v.replace(/[^0-9.]/g, "");

      if (v.startsWith(".")) v = "0" + v;

      const parts = v.split(".");
      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");

      inp.value = v;
    });
  });

  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const V = parseFloat(voltageEl.value);
    if (!V || V <= 0) return showError(voltageEl, "Enter valid voltage.");

    const IRmΩ = parseFloat(irEl.value);
    if (!IRmΩ || IRmΩ <= 0) return showError(irEl, "Enter valid internal resistance.");

    const I = parseFloat(currentEl.value);
    if (!I || I <= 0) return showError(currentEl, "Enter valid current.");

    // Convert milliohms to ohms
    const R = IRmΩ / 1000;

    // Voltage drop formula: Vdrop = I × R
    const Vdrop = I * R;

    const effectiveV = V - Vdrop;

    // Sag percentage
    const sagPercent = (Vdrop / V) * 100;

    // Power loss
    const powerLoss = Vdrop * I;

    // Simple torque/speed drop estimate
    const speedLoss = sagPercent * 0.6;
    const torqueLoss = sagPercent * 0.8;

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Voltage Sag:</strong> ${Vdrop.toFixed(2)} V</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Effective Voltage Under Load:</strong> ${effectiveV.toFixed(2)} V</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Sag Percentage:</strong> ${sagPercent.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Power Loss:</strong> ${powerLoss.toFixed(1)} W</p>`);

    lines.push(`<p class="fade-left ad4"><strong>Estimated Speed Loss:</strong> ${speedLoss.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Estimated Torque Loss:</strong> ${torqueLoss.toFixed(1)}%</p>`);

    lines.push(`<p class="small fade-left ad6">This is a realistic approximation based on EV battery voltage sag behavior.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    voltageEl.value = "";
    irEl.value = "";
    currentEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// PAYLOAD IMPACT RANGE ESTIMATOR
(function () {
  const root = document.getElementById("payload_range_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capEl = $("pr_capacity");
  const baseWEl = $("pr_base_weight");
  const payloadEl = $("pr_payload");
  const consEl = $("pr_consumption");

  const calcBtn = $("pr_calc");
  const resetBtn = $("pr_reset");
  const resultWrap = $("pr_result");
  const breakdown = $("pr_breakdown");

  // Decimal input only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const cap = parseFloat(capEl.value);
    if (!cap || cap <= 0) return showError(capEl, "Enter valid battery capacity.");

    const baseW = parseFloat(baseWEl.value);
    if (!baseW || baseW <= 0) return showError(baseWEl, "Enter valid base weight.");

    const payload = parseFloat(payloadEl.value);
    if (payload < 0 || isNaN(payload)) return showError(payloadEl, "Enter valid payload weight.");

    const baseCons = parseFloat(consEl.value);
    if (!baseCons || baseCons <= 0) return showError(consEl, "Enter valid Wh/km.");

    // Payload impact rule: ~0.4–0.7% more consumption per 1kg added
    const payloadFactor = 0.006; // 0.6% per kg (realistic mid-value)

    const percentIncrease = payload * payloadFactor;  
    const newConsumption = baseCons * (1 + percentIncrease);

    const baseRange = cap / baseCons;
    const newRange = cap / newConsumption;

    const rangeLossKm = baseRange - newRange;
    const rangeLossPercent = (rangeLossKm / baseRange) * 100;

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Updated Range:</strong> ${newRange.toFixed(2)} km</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Range Loss:</strong> ${rangeLossKm.toFixed(2)} km (${rangeLossPercent.toFixed(1)}%)</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Base Range:</strong> ${baseRange.toFixed(2)} km</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Base Consumption:</strong> ${baseCons.toFixed(1)} Wh/km</p>`);
    lines.push(`<p class="fade-left ad4"><strong>New Consumption:</strong> ${newConsumption.toFixed(2)} Wh/km</p>`);

    lines.push(`<p class="small fade-left ad5">Extra load increases rolling resistance, causing higher Wh/km consumption. This model uses realistic EV-grade load impact coefficients.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  // Reset
  function resetForm() {
    capEl.value = "";
    baseWEl.value = "";
    payloadEl.value = "";
    consEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();











// TERRAIN RESISTANCE CALCULATOR (ROLLING + GRADIENT + DRAG)
(function () {
  const root = document.getElementById("terrain_resistance_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const weightEl = $("tr_weight");
  const speedEl = $("tr_speed");
  const gradeEl = $("tr_grade");
  const rrEl = $("tr_rr");
  const dragEl = $("tr_drag");
  const wheelEl = $("tr_wheel");

  const calcBtn = $("tr_calc");
  const resetBtn = $("tr_reset");
  const resultWrap = $("tr_result");
  const breakdown = $("tr_breakdown");

  // Decimal Input


  // Error
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const weight = parseFloat(weightEl.value);
    if (!weight || weight <= 0) return showError(weightEl, "Enter valid weight.");

    const speedKm = parseFloat(speedEl.value);
    if (!speedKm || speedKm <= 0) return showError(speedEl, "Enter valid speed.");

    const grade = parseFloat(gradeEl.value);
    if (isNaN(grade)) return showError(gradeEl, "Enter valid gradient.");

    const Crr = parseFloat(rrEl.value);
    if (!Crr || Crr <= 0) return showError(rrEl, "Enter valid Crr.");

    let CdA = parseFloat(dragEl.value);
    if (!CdA || CdA <= 0) CdA = 0.6; // Default upright rider

    const wheelR = parseFloat(wheelEl.value);
    if (!wheelR || wheelR <= 0) return showError(wheelEl, "Enter valid wheel radius.");

    // Constants
    const g = 9.81;
    const airDensity = 1.225;

    // Convert speed
    const speedMS = speedKm / 3.6;

    // Rolling resistance
    const Frr = weight * g * Crr;

    // Gradient resistance
    const gradeRad = Math.atan(grade / 100);
    const Fg = weight * g * Math.sin(gradeRad);

    // Aerodynamic drag
    const Fd = 0.5 * airDensity * CdA * speedMS * speedMS;

    // Total resistance
    const Ftotal = Frr + Fg + Fd;

    // Required power
    const P = Ftotal * speedMS;

    // Torque at wheel
    const torque = Ftotal * wheelR;

    // Wh per km (efficiency 85%)
    const efficiency = 0.85;
    const WhPerKm = (P / speedMS) / efficiency / 3.6;

    // Range estimate for common batteries
    const range = cap => (cap / WhPerKm).toFixed(1);

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Total Required Power:</strong> ${P.toFixed(1)} W</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Total Resistance Force:</strong> ${Ftotal.toFixed(1)} N</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Rolling Resistance:</strong> ${Frr.toFixed(2)} N</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Gradient Force:</strong> ${Fg.toFixed(2)} N</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Aerodynamic Drag:</strong> ${Fd.toFixed(2)} N</p>`);

    lines.push(`<p class="fade-left ad5"><strong>Required Torque at Wheel:</strong> ${torque.toFixed(2)} Nm</p>`);
    lines.push(`<p class="fade-left ad6"><strong>Estimated Consumption:</strong> ${WhPerKm.toFixed(2)} Wh/km</p>`);

    lines.push(`<h4 class="fade-left ad7"><strong>Estimated Range:</strong></h4>`);
    lines.push(`<p class="fade-left ad8">With 500 Wh battery: ${range(500)} km</p>`);
    lines.push(`<p class="fade-left ad9">With 750 Wh battery: ${range(750)} km</p>`);
    lines.push(`<p class="fade-left ad10">With 1000 Wh battery: ${range(1000)} km</p>`);

    lines.push(`<p class="small fade-left ad11">Calculations follow real physics for rolling resistance, aerodynamic drag, and gravitational load.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    weightEl.value = "";
    speedEl.value = "";
    gradeEl.value = "";
    rrEl.value = "";
    dragEl.value = "";
    wheelEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();










// WHEEL SIZE + GEAR RATIO + SPEED CALCULATOR
(function () {
  const root = document.getElementById("wheel_ratio_speed_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const motorRpmEl = $("wr_motor_rpm");
  const gearRatioEl = $("wr_gear_ratio");
  const wheelDiameterEl = $("wr_wheel_diameter");
  const tireHeightEl = $("wr_tire_height");

  const calcBtn = $("wr_calc");
  const resetBtn = $("wr_reset");

  const resultWrap = $("wr_result");
  const breakdown = $("wr_breakdown");

  // Allow decimal input only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.nextElementSibling.nextElementSibling;
    if (err && err.classList.contains("error-message")) {
      err.textContent = msg;
      err.style.display = "block";
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

    const motorRPM = parseFloat(motorRpmEl.value);
    if (!motorRPM || motorRPM <= 0)
      return showError(motorRpmEl, "Enter valid RPM.");

    const gearRatio = parseFloat(gearRatioEl.value);
    if (!gearRatio || gearRatio <= 0)
      return showError(gearRatioEl, "Enter valid gear ratio.");

    const wheelDia = parseFloat(wheelDiameterEl.value);
    if (!wheelDia || wheelDia <= 0)
      return showError(wheelDiameterEl, "Enter valid wheel diameter.");

    const tireH = parseFloat(tireHeightEl.value);
    if (!tireH || tireH <= 0)
      return showError(tireHeightEl, "Enter valid tire height.");

    // Actual wheel diameter
    const totalInches = wheelDia + (tireH * 2);
    const diameterMeters = totalInches * 0.0254;

    // Wheel circumference
    const circumference = Math.PI * diameterMeters;

    // Wheel RPM (motor RPM / gear ratio)
    const wheelRPM = motorRPM / gearRatio;

    // Speed (m/min)
    const metersPerMin = circumference * wheelRPM;

    // Convert to km/h
    const speedKmH = (metersPerMin * 60) / 1000;

    // Convert to mph
    const speedMph = speedKmH * 0.621371;

    let lines = [];

    lines.push(`<h2 class="fade-left"><strong>Top Speed:</strong> ${speedKmH.toFixed(1)} km/h</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Top Speed:</strong> ${speedMph.toFixed(1)} mph</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Wheel RPM:</strong> ${wheelRPM.toFixed(2)} rpm</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Wheel Diameter:</strong> ${totalInches.toFixed(2)} in (${diameterMeters.toFixed(3)} m)</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Circumference:</strong> ${circumference.toFixed(3)} m</p>`);

    lines.push(`<p class="small fade-left ad5">This calculator uses wheel circumference × wheel RPM to determine realistic eBike top speed.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    motorRpmEl.value = "";
    gearRatioEl.value = "";
    wheelDiameterEl.value = "";
    tireHeightEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();









// BATTERY C-RATE SAFETY CALCULATOR
(function () {
  const root = document.getElementById('c_rate_calculator');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  // Elements
  const capEl = $('cr_capacity');
  const unitEl = $('cr_unit');
  const voltageWrap = $('cr_voltage_wrap');
  const voltageEl = $('cr_voltage');
  const controllerEl = $('cr_controller_current');
  const bmsEl = $('cr_bms_current');
  const desiredCEl = $('cr_desired_c');

  const calcBtn = $('cr_calc');
  const resetBtn = $('cr_reset');
  const resultWrap = $('cr_result');
  const breakdown = $('cr_breakdown');

  // Allow decimal input only
  root.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('input', () => {
      let v = inp.value;
      v = v.replace(/[^0-9.]/g, '');
      if (v.startsWith('.')) v = '0' + v;
      const parts = v.split('.');
      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
      inp.value = v;
    });
  });

  // Toggle voltage input (fixed logic)
  function toggleVoltage() {
    if (unitEl.value === 'ah') {
      voltageWrap.style.display = 'none';
      voltageEl.value = ''; // clear unwanted value when hidden
    } else {
      voltageWrap.style.display = 'block';
    }
  }
  unitEl.addEventListener('change', toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector('.error-message');
    if (err) {
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

  // MAIN CALCULATION
  function calculate() {
    clearErrors();

    // Battery Capacity
    let capacityRaw = parseFloat(capEl.value);
    if (!capacityRaw || capacityRaw <= 0) {
      showError(capEl, 'Enter valid battery capacity.');
      capEl.focus();
      return;
    }

    // Convert Capacity to Ah (corrected)
    let capacityAh;

    if (unitEl.value === 'ah') {
      // Ah → use directly (voltage must NOT be required)
      capacityAh = capacityRaw;

    } else {
      // Wh selected → voltage REQUIRED
      const vRaw = voltageEl.value.trim();
      const voltage = (vRaw !== '') ? parseFloat(vRaw) : NaN;

      if (!voltage || voltage <= 0) {
        showError(voltageEl, 'Enter valid voltage to convert Wh → Ah.');
        voltageEl.focus();
        return;
      }

      capacityAh = capacityRaw / voltage;
    }

    if (!capacityAh || capacityAh <= 0) {
      showError(capEl, 'Converted capacity (Ah) is invalid.');
      return;
    }

    // Controller current
    const controllerA = parseFloat(controllerEl.value);
    if (!controllerA || controllerA <= 0) {
      showError(controllerEl, 'Enter controller continuous current.');
      controllerEl.focus();
      return;
    }

    // BMS current
    const bmsA = parseFloat(bmsEl.value);
    if (!bmsA || bmsA <= 0) {
      showError(bmsEl, 'Enter BMS continuous current.');
      bmsEl.focus();
      return;
    }

    // Optional desired C
    const desiredC = parseFloat(desiredCEl.value) || null;

    // ---------- CALCULATIONS ----------
    const requiredC = controllerA / capacityAh; // needed continuous C
    const suggestedMinC = requiredC;

    const safeCurrentAtDesiredC = desiredC
      ? desiredC * capacityAh
      : null;

    const bmsMargin = bmsA - controllerA;
    const bmsMarginPct = (bmsA / controllerA - 1) * 100;

    // Safety logic
    let safetyLevel = 'Safe';
    let safetyNote = '';

    if (bmsA < controllerA) {
      safetyLevel = 'UNSAFE';
      safetyNote = 'BMS continuous current is LOWER than controller draw.';
    } else if (requiredC > 5) {
      safetyLevel = 'Danger';
      safetyNote = 'Required C-rate exceeds 5C — extreme stress on batteries.';
    } else if (requiredC > 3) {
      safetyLevel = 'High Risk';
      safetyNote = 'Required C-rate above 3C — many cells may overheat.';
    } else if (requiredC > 1.5) {
      safetyLevel = 'Warning';
      safetyNote = 'Required C-rate between 1.5–3C — monitor battery temperature.';
    } else {
      safetyLevel = 'Safe';
      safetyNote = 'Battery is well within safe C-rate range.';
    }

    // ---------- OUTPUT ----------
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Required C-rate:</strong> ${requiredC.toFixed(3)} C</h2>`);
    lines.push(`<h3 class="fade-left ad1"><strong>Battery Capacity Used:</strong> ${capacityAh.toFixed(3)} Ah</h3>`);

    lines.push(`<p class="fade-left ad2"><strong>Controller Continuous:</strong> ${controllerA.toFixed(2)} A</p>`);
    lines.push(`<p class="fade-left ad3"><strong>BMS Continuous:</strong> ${bmsA.toFixed(2)} A</p>`);

    if (desiredC) {
      lines.push(`<p class="fade-left ad4"><strong>Max Current at ${desiredC}C:</strong> ${safeCurrentAtDesiredC.toFixed(2)} A</p>`);
    }

    lines.push(`<p class="fade-left ad5"><strong>BMS Margin:</strong> ${bmsMargin.toFixed(2)} A (${bmsMarginPct.toFixed(1)}%)</p>`);

    lines.push(`<p class="fade-left ad6"><strong>Safety Level:</strong> ${safetyLevel}</p>`);
    lines.push(`<p class="fade-left ad7">${safetyNote}</p>`);

    lines.push(`<p class="small fade-left ad8">Minimum safe C-rate for your controller: <strong>${suggestedMinC.toFixed(3)}C</strong>.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  // RESET
  function resetForm() {
    capEl.value = '';
    unitEl.value = 'ah';
    voltageEl.value = '';
    controllerEl.value = '';
    bmsEl.value = '';
    desiredCEl.value = '';

    clearErrors();
    resultWrap.hidden = true;
    toggleVoltage();
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();








// BATTERY INTERNAL RESISTANCE (IR) CALCULATOR
(function () {
  const root = document.getElementById("battery_ir_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const vOpenEl = $("ir_v_open");
  const vLoadEl = $("ir_v_load");
  const currentEl = $("ir_current");

  const calcBtn = $("ir_calc");
  const resetBtn = $("ir_reset");
  const resultWrap = $("ir_result");
  const breakdown = $("ir_breakdown");

  // Decimal input sanitizer
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) {
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

    const Vopen = parseFloat(vOpenEl.value);
    if (!Vopen || Vopen <= 0) {
      showError(vOpenEl, "Enter valid open-circuit voltage.");
      return;
    }

    const Vload = parseFloat(vLoadEl.value);
    if (!Vload || Vload <= 0 || Vload >= Vopen) {
      showError(vLoadEl, "Load voltage must be less than open voltage.");
      return;
    }

    const I = parseFloat(currentEl.value);
    if (!I || I <= 0) {
      showError(currentEl, "Enter valid load current.");
      return;
    }

    // -------- INTERNAL RESISTANCE ----------
    const Vdrop = Vopen - Vload;
    const R = Vdrop / I;
    const R_milliohms = R * 1000;

    // Heat loss at that current
    const powerLoss = I * I * R;

    // Predict sag at common loads
    const sag10A = (10 * R);
    const sag20A = (20 * R);
    const sag30A = (30 * R);

    // Health interpretation
    let healthNote = "";
    let condition = "Unknown";

    if (R_milliohms < 50) {
      condition = "Excellent";
      healthNote = "IR is extremely low — high quality pack or new battery.";
    } else if (R_milliohms < 100) {
      condition = "Good";
      healthNote = "Battery is healthy and performing well.";
    } else if (R_milliohms < 150) {
      condition = "Fair";
      healthNote = "Some aging detectable — performance slightly reduced.";
    } else if (R_milliohms < 250) {
      condition = "Poor";
      healthNote = "Battery aging noticeably — expect voltage sag under load.";
    } else {
      condition = "Very Poor";
      healthNote = "High resistance — battery weak, unsafe for high loads.";
    }

    // -------- OUTPUT ----------
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Internal Resistance:</strong> ${R_milliohms.toFixed(2)} mΩ</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Voltage Drop:</strong> ${Vdrop.toFixed(3)} V</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Power Lost as Heat:</strong> ${powerLoss.toFixed(2)} W</p>`);

    lines.push(`<hr>`);

    lines.push(`<p class="fade-left ad3"><strong>Predicted Voltage Sag:</strong></p>`);
    lines.push(`<p class="fade-left ad4">• At 10A: ${sag10A.toFixed(3)} V</p>`);
    lines.push(`<p class="fade-left ad5">• At 20A: ${sag20A.toFixed(3)} V</p>`);
    lines.push(`<p class="fade-left ad6">• At 30A: ${sag30A.toFixed(3)} V</p>`);

    lines.push(`<hr>`);
    lines.push(`<h3 class="fade-left ad7"><strong>Battery Condition:</strong> ${condition}</h3>`);
    lines.push(`<p class="fade-left ad8">${healthNote}</p>`);

    lines.push(`<p class="small fade-left ad9">Internal resistance is one of the strongest indicators of battery health. Lower IR = higher performance, less heat, and better lifespan.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  // RESET
  function resetForm() {
    vOpenEl.value = "";
    vLoadEl.value = "";
    currentEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();









// BATTERY CHARGE EFFICIENCY CALCULATOR
(function () {
  const root = document.getElementById("battery_charge_efficiency_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capacityEl = $("bce_capacity");
  const capModeEl = $("bce_cap_mode");
  const voltageWrap = $("bce_voltage_wrap");
  const voltageEl = $("bce_voltage");

  const chargerPowerEl = $("bce_charger_power");
  const chargeTimeEl = $("bce_charge_time");
  const costEl = $("bce_cost");

  const calcBtn = $("bce_calc");
  const resetBtn = $("bce_reset");
  const resultWrap = $("bce_result");
  const breakdown = $("bce_breakdown");

  // Allow decimal input
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Toggle voltage field
  function toggleVoltage() {
    voltageWrap.style.display =
      capModeEl.value === "ah" ? "block" : "none";
  }
  capModeEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) {
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

  // MAIN CALC
  function calculate() {
    clearErrors();

    const rawCapacity = parseFloat(capacityEl.value);
    if (!rawCapacity || rawCapacity <= 0) {
      showError(capacityEl, "Enter valid battery capacity.");
      return;
    }

    let capacityWh;

    // Convert Ah → Wh
    if (capModeEl.value === "ah") {
      const voltage = parseFloat(voltageEl.value);
      if (!voltage || voltage <= 0) {
        showError(voltageEl, "Enter voltage.");
        return;
      }
      capacityWh = rawCapacity * voltage;
    } else {
      capacityWh = rawCapacity; // already Wh
    }

    const chargerW = parseFloat(chargerPowerEl.value);
    if (!chargerW || chargerW <= 0) {
      showError(chargerPowerEl, "Enter valid charger power.");
      return;
    }

    const chargeHours = parseFloat(chargeTimeEl.value);
    if (!chargeHours || chargeHours <= 0) {
      showError(chargeTimeEl, "Enter valid charging time.");
      return;
    }

    const costPerKWh = parseFloat(costEl.value) || null;

    // Energy supplied to charger
    const energyInputWh = chargerW * chargeHours;

    // Efficiency
    const efficiency = (capacityWh / energyInputWh) * 100;

    // Wasted energy
    const wastedWh = Math.max(energyInputWh - capacityWh, 0);

    let wastedCost = null;
    if (costPerKWh && wastedWh > 0) {
      wastedCost = (wastedWh / 1000) * costPerKWh;
    }

    // Notes
    let note = "";
    if (efficiency > 100) {
      note = "⚠️ Your input values imply more energy stored than supplied. Check inputs.";
    } else if (efficiency < 60) {
      note = "⚠️ Efficiency is very low — charger or battery may be old or overheating.";
    } else {
      note = "Charging efficiency is within typical range (70%–92%).";
    }

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Charging Efficiency:</strong> ${efficiency.toFixed(1)}%</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Energy Supplied to Charger:</strong> ${energyInputWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Energy Stored in Battery:</strong> ${capacityWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Energy Lost as Heat:</strong> ${wastedWh.toFixed(1)} Wh</p>`);

    if (wastedCost !== null) {
      lines.push(`<p class="fade-left ad4"><strong>Cost of Wasted Energy:</strong> ${wastedCost.toFixed(3)}</p>`);
    }

    lines.push(`<hr>`);
    lines.push(`<p class="fade-left ad5">${note}</p>`);
    lines.push(`<p class="small fade-left ad6">Most lithium battery chargers operate at 80–92% efficiency.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    capacityEl.value = "";
    voltageEl.value = "";
    chargerPowerEl.value = "";
    chargeTimeEl.value = "";
    costEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();











// TINY WH <-> AH CONVERTER
(function () {
  const root = document.getElementById("tiny_wh_ah_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const valueEl = $("ta_value");
  const modeEl = $("ta_mode");
  const voltageWrap = $("ta_voltage_wrap");
  const voltageEl = $("ta_voltage");
  const calcBtn = $("ta_calc");
  const resetBtn = $("ta_reset");
  const resultWrap = $("ta_result");
  const output = $("ta_output");

  // Allow decimal input only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Toggle voltage field
  function toggleVoltage() {
    voltageWrap.style.display = (modeEl.value === "wh_to_ah") ? "block" : "none";
    if (modeEl.value === "ah_to_wh") voltageEl.value = "";
  }
  modeEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) {
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

  // MAIN CALC
  function calculate() {
    clearErrors();

    const value = parseFloat(valueEl.value);
    if (!value || value <= 0) {
      showError(valueEl, "Enter a valid number.");
      return;
    }

    let result = "";

    // Wh → Ah
    if (modeEl.value === "wh_to_ah") {
      const vRaw = voltageEl.value.trim();
      const voltage = vRaw !== "" ? parseFloat(vRaw) : NaN;

      if (!voltage || voltage <= 0) {
        showError(voltageEl, "Enter valid voltage.");
        return;
      }

      const ah = value / voltage;
      result = `<h3 class="fade-left">Result: <strong>${ah.toFixed(3)} Ah</strong></h3>`;
    }

    // Ah → Wh
    else {
      const wh = value * 48; // default voltage if none provided (optional)
      result = `<h3 class="fade-left ad1">Result: <strong>${wh.toFixed(1)} Wh</strong></h3>
                <p class="small fade-left ad2">Using default 48V (modify if needed).</p>`;
    }

    output.innerHTML = result;
    resultWrap.hidden = false;
  }

  function resetForm() {
    valueEl.value = "";
    voltageEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
    toggleVoltage();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();









// BATTERY PARALLEL / SERIES CONFIG BUILDER
(function () {
  const root = document.getElementById('pack_builder_calc');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);

  // Elements
  const cellTypeEl = $('pb_cell_type');
  const cellVoltEl = $('pb_cell_voltage');
  const cellCapEl = $('pb_cell_capacity'); // mAh
  const cellMaxAEl = $('pb_cell_maxa');

  const seriesEl = $('pb_series');
  const parallelEl = $('pb_parallel');

  const calcBtn = $('pb_calc');
  const resetBtn = $('pb_reset');
  const resultWrap = $('pb_result');
  const breakdown = $('pb_breakdown');

  // Preset definitions (typical, editable by user)
  const presets = {
    '18650': { v: 3.6, mAh: 3400, maxA: 5 },
    '21700': { v: 3.6, mAh: 5000, maxA: 10 },
    'pouch':  { v: 3.7, mAh: 10000, maxA: 10 }
  };

  // Input sanitizer (allow decimal and leading dot)
  root.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('input', () => {
      let v = inp.value;
      v = v.replace(/[^0-9.]/g, '');
      if (v.startsWith('.')) v = '0' + v;
      const parts = v.split('.');
      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
      inp.value = v;
    });
  });

  // When preset changes, populate fields with preset values (unless Custom)
  function applyPreset() {
    const type = cellTypeEl.value;
    if (type === 'custom') {
      // leave fields as-is for custom entry (user must fill)
      return;
    }
    const p = presets[type];
    if (!p) return;
    cellVoltEl.value = p.v;
    cellCapEl.value = p.mAh;
    cellMaxAEl.value = p.maxA;
  }
  cellTypeEl.addEventListener('change', applyPreset);
  applyPreset();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector('.error-message');
    if (err) {
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

  // MAIN BUILD
  function calculate() {
    clearErrors();

    // cell nominal voltage
    const vCell = parseFloat(cellVoltEl.value);
    if (!vCell || vCell <= 0) {
      showError(cellVoltEl, 'Enter valid cell nominal voltage (V).');
      return;
    }

    // cell capacity in mAh -> convert to Ah
    const cellmAh = parseFloat(cellCapEl.value);
    if (!cellmAh || cellmAh <= 0) {
      showError(cellCapEl, 'Enter valid cell capacity in mAh.');
      return;
    }
    const cellAh = cellmAh / 1000;

    // cell max continuous current A
    const cellMaxA = parseFloat(cellMaxAEl.value);
    if (!cellMaxA || cellMaxA <= 0) {
      showError(cellMaxAEl, 'Enter valid cell max continuous current (A).');
      return;
    }

    // series and parallel counts
    const S = Math.floor(parseFloat(seriesEl.value));
    if (!S || S <= 0) {
      showError(seriesEl, 'Enter valid number of series cells (S).');
      return;
    }
    const P = Math.floor(parseFloat(parallelEl.value));
    if (!P || P <= 0) {
      showError(parallelEl, 'Enter valid number of parallel cells (P).');
      return;
    }

    // computed pack values
    const packVoltage = vCell * S; // V
    const packAh = cellAh * P;     // Ah
    const packWh = packVoltage * packAh; // Wh

    // max continuous current of pack = cellMaxA * P
    const packMaxA = cellMaxA * P;

    // max continuous power = Vpack * Imax
    const packMaxPower = packVoltage * packMaxA; // W

    // total cells
    const totalCells = S * P;

    // Recommended continuous C of pack = packMaxA / packAh
    const packC = packMaxA / packAh;

    // Safety notes (simple guidance)
    let safetyNotes = [];
    if (packC >= 5) safetyNotes.push('High C-rate pack (≥5C) — suitable for high-power applications but ensure good cooling.');
    else if (packC >= 2.5) safetyNotes.push('Moderate C-rate (2.5–5C) — typical for many ebike packs.');
    else safetyNotes.push('Low C-rate (<2.5C) — pack favors capacity over high discharge.');

    if (packVoltage > 60) safetyNotes.push('Pack nominal voltage >60V — ensure controller & BMS support this voltage.');

    // Output lines
    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Pack Summary (${S}S × ${P}P):</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Cells used:</strong> ${totalCells} cells</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Pack Nominal Voltage:</strong> ${packVoltage.toFixed(2)} V</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Pack Capacity:</strong> ${packAh.toFixed(3)} Ah (${Math.round(packAh * 1000)} mAh)</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Total Energy:</strong> ${packWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Max Continuous Current (pack):</strong> ${packMaxA.toFixed(2)} A</p>`);
    lines.push(`<p class="fade-left ad6"><strong>Max Continuous Power:</strong> ${packMaxPower.toFixed(1)} W</p>`);
    lines.push(`<p class="fade-left ad7"><strong>Pack Continuous C (approx):</strong> ${packC.toFixed(2)} C</p>`);
    lines.push(`<hr>`);
    lines.push(`<h3 class="fade-left ad8">Cell Specs (per cell)</h3>`);
    lines.push(`<p class="fade-left ad9"><strong>Cell nominal voltage:</strong> ${vCell.toFixed(2)} V</p>`);
    lines.push(`<p class="fade-left ad10"><strong>Cell capacity:</strong> ${cellAh.toFixed(3)} Ah (${Math.round(cellmAh)} mAh)</p>`);
    lines.push(`<p class="fade-left ad11"><strong>Cell max continuous:</strong> ${cellMaxA.toFixed(2)} A</p>`);

    if (safetyNotes.length) {
      lines.push(`<hr>`);
      lines.push(`<h4 class="fade-left ad12">Notes</h4>`);
      safetyNotes.forEach(n => lines.push(`<p class="fade-left ad13 small">• ${n}</p>`));
    }

    lines.push(`<p class="small fade-left ad14">These are nominal calculations. For pack building always consider cell balancing, BMS ratings, wiring, fuses, and thermal management.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    // reset to preset 18650
    cellTypeEl.value = '18650';
    applyPreset(); // re-populate fields
    seriesEl.value = '';
    parallelEl.value = '';
    clearErrors();
    resultWrap.hidden = true;
  }

  // helper: apply preset reuse (re-declare here)
  function applyPreset() {
    const type = cellTypeEl.value;
    if (type === 'custom') return;
    const p = presets[type];
    if (!p) return;
    cellVoltEl.value = p.v;
    cellCapEl.value = p.mAh;
    cellMaxAEl.value = p.maxA;
  }

  // Attach events
  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
  cellTypeEl.addEventListener('change', applyPreset);

})();










// ADVANCED LiFePO4 & FUTURE CELL TYPE PACK BUILDER
(function () {
  const root = document.getElementById("cell_chemistry_pack_builder");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const cellType = $("cc_cell_type");
  const voltEl = $("cc_voltage");
  const capEl = $("cc_capacity");
  const maxAEl = $("cc_maxA");
  const SEl = $("cc_series");
  const PEl = $("cc_parallel");

  const calcBtn = $("cc_calc");
  const resetBtn = $("cc_reset");
  const resultWrap = $("cc_result");
  const breakdown = $("cc_breakdown");

  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  const presets = {
    lifepo4:  { v: 3.2,  mAh: 6000, maxA: 30, cycles: "2500–6000 cycles" },
    lto:      { v: 2.3,  mAh: 1500, maxA: 30, cycles: "5000–20000 cycles" },
    solidstate:{ v: 3.8, mAh: 5000, maxA: 10, cycles: "1200–3000 cycles" },
    sodium:   { v: 3.0,  mAh: 4000, maxA: 6,  cycles: "2000+ cycles" },
    lisulfur: { v: 2.1,  mAh: 8000, maxA: 5,  cycles: "100–500 cycles (experimental)" }
  };

  function applyPreset() {
    const type = cellType.value;
    if (type === "custom") return;
    const p = presets[type];
    voltEl.value = p.v;
    capEl.value = p.mAh;
    maxAEl.value = p.maxA;
  }
  cellType.addEventListener("change", applyPreset);
  applyPreset();

  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = "block"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = ""; e.style.display = "none";
    });
  }

  function calculate() {
    clearErrors();

    const v = parseFloat(voltEl.value);
    if (!v || v <= 0) return showError(voltEl, "Enter valid voltage.");

    const mAh = parseFloat(capEl.value);
    if (!mAh || mAh <= 0) return showError(capEl, "Enter valid capacity.");

    const maxA = parseFloat(maxAEl.value);
    if (!maxA || maxA <= 0) return showError(maxAEl, "Enter valid max current.");

    const S = Math.floor(parseFloat(SEl.value));
    if (!S || S <= 0) return showError(SEl, "Enter valid series count.");

    const P = Math.floor(parseFloat(PEl.value));
    if (!P || P <= 0) return showError(PEl, "Enter valid parallel count.");

    const Ah = mAh / 1000;
    const Vpack = v * S;
    const AHPack = Ah * P;
    const WhPack = Vpack * AHPack;

    const maxPackA = maxA * P;
    const maxPower = maxPackA * Vpack;

    const totalCells = S * P;

    let cycleInfo = "—";
    if (cellType.value !== "custom") cycleInfo = presets[cellType.value].cycles;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>${S}S × ${P}P Pack Built</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Total Cells:</strong> ${totalCells}</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Pack Voltage:</strong> ${Vpack.toFixed(2)} V</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Pack Capacity:</strong> ${AHPack.toFixed(2)} Ah</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Total Energy:</strong> ${WhPack.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Max Continuous Current:</strong> ${maxPackA.toFixed(1)} A</p>`);
    lines.push(`<p class="fade-left ad6"><strong>Max Continuous Power:</strong> ${maxPower.toFixed(1)} W</p>`);
    lines.push(`<p class="fade-left ad7"><strong>Estimated Cycle Life (Chemistry):</strong> ${cycleInfo}</p>`);

    // Safety insights
    if (cellType.value === "lifepo4")
      lines.push(`<p class="small fade-left ad8">LFP performs poorly below 0°C during charging.</p>`);
    if (cellType.value === "lto")
      lines.push(`<p class="small fade-left ad9">LTO is excellent for cold climates and ultra-long life.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    cellType.value = "lifepo4";
    applyPreset();
    voltEl.value = capEl.value = maxAEl.value = "";
    SEl.value = PEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();










// UNIVERSAL BATTERY RUNTIME CALCULATOR
(function () {
  const root = document.getElementById("battery_runtime_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  // Elements
  const capEl = $("br_capacity");
  const unitEl = $("br_unit");
  const voltWrap = $("br_voltage_wrap");
  const voltEl = $("br_voltage");
  const loadEl = $("br_load");
  const effEl = $("br_eff");

  const calcBtn = $("br_calc");
  const resetBtn = $("br_reset");
  const resultWrap = $("br_result");
  const breakdown = $("br_breakdown");

  // Decimal input restriction
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Toggle voltage when Ah selected
  function toggleVoltage() {
    voltWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = "block"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = ""; e.style.display = "none";
    });
  }

  // Main calculation
  function calculate() {
    clearErrors();

    // Capacity
    const cap = parseFloat(capEl.value);
    if (!cap || cap <= 0) return showError(capEl, "Enter battery capacity.");

    // Convert to Wh
    let batteryWh;
    if (unitEl.value === "ah") {
      const v = parseFloat(voltEl.value);
      if (!v || v <= 0) return showError(voltEl, "Enter valid voltage.");
      batteryWh = cap * v;
    } else {
      batteryWh = cap;
    }

    // Load
    const loadW = parseFloat(loadEl.value);
    if (!loadW || loadW <= 0)
      return showError(loadEl, "Enter valid load power (W).");

    // Efficiency
    let eff = parseFloat(effEl.value);
    if (!eff || eff <= 0 || eff > 100) eff = 100; // default 100

    const usableWh = batteryWh * (eff / 100);

    // Runtime in hours
    const hours = usableWh / loadW;

    const wholeH = Math.floor(hours);
    const mins = Math.floor((hours - wholeH) * 60);

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Estimated Runtime:</strong> ${wholeH}h ${mins}m</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Battery Energy:</strong> ${batteryWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Usable Energy (eff applied):</strong> ${usableWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Load Consumption:</strong> ${loadW} W</p>`);
    lines.push(`<p class="fade-left ad4 small">Real runtime may vary depending on load spikes, temperature, and battery age.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    capEl.value = "";
    voltEl.value = "";
    loadEl.value = "";
    effEl.value = "";
    unitEl.value = "wh";
    toggleVoltage();
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();








// BATTERY DISCHARGE TIME @ FIXED WATT LOAD
(function () {
  const root = document.getElementById("battery_discharge_time_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capEl = $("bd_capacity");
  const unitEl = $("bd_unit");
  const voltWrap = $("bd_voltage_wrap");
  const voltEl = $("bd_voltage");
  const loadEl = $("bd_load");

  const calcBtn = $("bd_calc");
  const resetBtn = $("bd_reset");
  const resultWrap = $("bd_result");
  const breakdown = $("bd_breakdown");

  // Decimal-safe inputs
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const parts = v.split(".");
      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
      inp.value = v;
    });
  });

  // Toggle voltage input
  function toggleVoltage() {
    voltWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = "block"; }
  }

  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = ""; e.style.display = "none";
    });
  }

  // Main Calculation
  function calculate() {
    clearErrors();

    const capacity = parseFloat(capEl.value);
    if (!capacity || capacity <= 0)
      return showError(capEl, "Enter valid battery capacity.");

    let batteryWh;

    if (unitEl.value === "ah") {
      const v = parseFloat(voltEl.value);
      if (!v || v <= 0)
        return showError(voltEl, "Enter valid voltage.");
      batteryWh = capacity * v;
    } else {
      batteryWh = capacity;
    }

    const loadW = parseFloat(loadEl.value);
    if (!loadW || loadW <= 0)
      return showError(loadEl, "Enter a valid watt load.");

    // Formula: runtime = Wh / W
    const hours = batteryWh / loadW;

    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Runtime:</strong> ${h}h ${m}m</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Battery Energy:</strong> ${batteryWh.toFixed(2)} Wh</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Load:</strong> ${loadW} W</p>`);
    lines.push(`<p class="small fade-left ad3">This is an ideal DC discharge estimate. Actual results vary with temperature, age, and voltage sag.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    capEl.value = "";
    voltEl.value = "";
    loadEl.value = "";
    unitEl.value = "wh";
    toggleVoltage();
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();








// BATTERY STORAGE LOSS CALCULATOR
(function () {
  const root = document.getElementById("battery_storage_loss_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capEl = $("bsl_capacity");
  const unitEl = $("bsl_unit");
  const voltWrap = $("bsl_voltage_wrap");
  const voltEl = $("bsl_voltage");
  const chemEl = $("bsl_chem");
  const customRateWrap = $("bsl_custom_rate_wrap");
  const customRateEl = $("bsl_custom_rate");
  const monthsEl = $("bsl_months");

  const calcBtn = $("bsl_calc");
  const resetBtn = $("bsl_reset");
  const resultWrap = $("bsl_result");
  const breakdown = $("bsl_breakdown");

  // Allowed chemistry monthly loss (%) values
  const chemRates = {
    liion: 3,
    lifepo4: 2,
    lto: 1,
    solid: 1.5,
    leadacid: 5,
    nimh: 10
  };

  // Decimal-safe inputs
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Show/hide voltage
  function toggleVoltage() {
    voltWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Show/hide custom rate
  function toggleCustomRate() {
    customRateWrap.style.display = chemEl.value === "custom" ? "block" : "none";
  }
  chemEl.addEventListener("change", toggleCustomRate);
  toggleCustomRate();

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = "block"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = ""; e.style.display = "none";
    });
  }

  // Main Calculation
  function calculate() {
    clearErrors();

    // Battery capacity
    const cap = parseFloat(capEl.value);
    if (!cap || cap <= 0)
      return showError(capEl, "Enter valid capacity.");

    let batteryWh;
    if (unitEl.value === "ah") {
      const v = parseFloat(voltEl.value);
      if (!v || v <= 0)
        return showError(voltEl, "Enter valid voltage.");
      batteryWh = cap * v;
    } else {
      batteryWh = cap;
    }

    // Months
    const months = parseFloat(monthsEl.value);
    if (!months || months < 0)
      return showError(monthsEl, "Enter valid number of months.");

    // Rate
    let rate;
    if (chemEl.value === "custom") {
      rate = parseFloat(customRateEl.value);
      if (!rate || rate <= 0)
        return showError(customRateEl, "Enter valid custom rate.");
    } else {
      rate = chemRates[chemEl.value];
    }

    // Apply compounding storage loss:
    // Remaining = Wh × (1 − rate/100)^months
    const remainingWh = batteryWh * Math.pow((1 - rate / 100), months);
    const lostWh = batteryWh - remainingWh;
    const remainingPct = (remainingWh / batteryWh) * 100;

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Remaining Capacity:</strong> ${remainingWh.toFixed(1)} Wh (${remainingPct.toFixed(1)}%)</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Initial Capacity:</strong> ${batteryWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Total Loss:</strong> ${lostWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Monthly Loss Rate:</strong> ${rate}%</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Months Stored:</strong> ${months}</p>`);
    lines.push(`<p class="small fade-left ad5">Actual loss varies with temperature, state of charge, storage conditions, and battery age.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    capEl.value = "";
    voltEl.value = "";
    monthsEl.value = "";
    unitEl.value = "wh";
    chemEl.value = "liion";
    customRateEl.value = "";
    toggleCustomRate();
    toggleVoltage();
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// INVERTER RUNTIME CALCULATOR
(function () {
  const root = document.getElementById("inverter_runtime_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const capEl = $("ir_capacity");
  const unitEl = $("ir_unit");
  const voltWrap = $("ir_voltage_wrap");
  const voltEl = $("ir_voltage");
  const effEl = $("ir_eff");
  const idleEl = $("ir_idle");
  const loadEl = $("ir_load");

  const calcBtn = $("ir_calc");
  const resetBtn = $("ir_reset");
  const resultWrap = $("ir_result");
  const breakdown = $("ir_breakdown");

  // Decimal sanitization
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Show voltage if Ah selected
  function toggleVoltage() {
    voltWrap.style.display = unitEl.value === "ah" ? "block" : "none";
  }
  unitEl.addEventListener("change", toggleVoltage);
  toggleVoltage();

  // Helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = "block"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = ""; e.style.display = "none";
    });
  }

  function calculate() {
    clearErrors();

    // Capacity
    const cap = parseFloat(capEl.value);
    if (!cap || cap <= 0) return showError(capEl, "Enter valid battery capacity.");

    // Convert to Wh
    let batteryWh;
    if (unitEl.value === "ah") {
      const v = parseFloat(voltEl.value);
      if (!v || v <= 0) return showError(voltEl, "Enter valid voltage.");
      batteryWh = cap * v;
    } else {
      batteryWh = cap;
    }

    // Efficiency
    let eff = parseFloat(effEl.value);
    if (!eff || eff <= 0 || eff > 100) eff = 100; // default 100%

    // Idle power
    let idle = parseFloat(idleEl.value);
    if (!idle || idle < 0) idle = 0;

    // Load
    const loadW = parseFloat(loadEl.value);
    if (!loadW || loadW <= 0)
      return showError(loadEl, "Enter valid AC load (W).");

    // Usable energy
    const usableWh = batteryWh * (eff / 100);

    // Total load
    const totalLoadW = loadW + idle;

    // Runtime
    const hours = usableWh / totalLoadW;

    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);

    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Estimated Runtime:</strong> ${h}h ${m}m</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Battery Energy:</strong> ${batteryWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Usable Energy (eff applied):</strong> ${usableWh.toFixed(1)} Wh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>AC Load:</strong> ${loadW} W</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Inverter Idle Load:</strong> ${idle} W</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Total Load:</strong> ${totalLoadW} W</p>`);
    lines.push(`<p class="small fade-left ad6">Actual runtime varies with inverter temperature, wiring efficiency, battery age, voltage sag, and surge events.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    capEl.value = "";
    voltEl.value = "";
    effEl.value = "";
    idleEl.value = "";
    loadEl.value = "";
    unitEl.value = "wh";
    toggleVoltage();
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// UNIVERSAL BATTERY CHARGER SELECTOR
(function () {
  const root = document.getElementById("charger_selector_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const voltageEl = $("ucs_voltage");
  const capacityEl = $("ucs_capacity");
  const unitEl = $("ucs_unit");
  const cRateEl = $("ucs_c_rate");

  const calcBtn = $("ucs_calc");
  const resetBtn = $("ucs_reset");
  const resultWrap = $("ucs_result");
  const breakdown = $("ucs_breakdown");

  // Decimal sanitizing
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) {
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

    const V = parseFloat(voltageEl.value);
    if (!V || V <= 0) {
      showError(voltageEl, "Enter valid battery voltage.");
      return;
    }

    let rawCap = parseFloat(capacityEl.value);
    if (!rawCap || rawCap <= 0) {
      showError(capacityEl, "Enter battery capacity.");
      return;
    }

    // Convert to Wh
    let Wh;
    if (unitEl.value === "ah") Wh = rawCap * V;
    else Wh = rawCap;

    // Amp-hour conversion
    const Ah = Wh / V;

    const cRate = parseFloat(cRateEl.value);

    // Charger Current Recommended
    const chargeA = Ah * cRate;

    // Charger Wattage Recommended
    const chargerW = chargeA * V;

    // Approx charge time (80-90% efficiency assumed)
    const chargeHours = Ah / chargeA;

    // Safety notes
    let safety = "";
    if (cRate <= 0.2) safety = "Excellent for long battery life.";
    else if (cRate <= 0.5) safety = "Safe charging rate for most lithium batteries.";
    else if (cRate <= 1.0) safety = "Fast charging — ensure battery is high-quality and well-cooled.";
    else safety = "⚠️ Unsafe: Do NOT charge above 1C without manufacturer approval.";

    // Output
    const lines = [];
    lines.push(`<h2 class="fade-left"><strong>Recommended Charger Specs</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Battery Capacity:</strong> ${Ah.toFixed(2)} Ah (${Wh.toFixed(1)} Wh)</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Charge Current (A):</strong> ${chargeA.toFixed(2)} A</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Charger Wattage:</strong> ${chargerW.toFixed(1)} W</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Estimated Charge Time:</strong> ${chargeHours.toFixed(1)} hours</p>`);
    lines.push(`<p class="fade-left ad5">${safety}</p>`);
    lines.push(`<p class="small fade-left ad6">A charger must match your battery chemistry (Li-ion / LiFePO4 / Lead-acid) and CC/CV profile.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    voltageEl.value = "";
    capacityEl.value = "";
    unitEl.value = "ah";
    cRateEl.value = "0.2";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();








// WIRE GAUGE SELECTOR (AWG & mm²)
(function () {
  const root = document.getElementById("wire_gauge_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const currentEl = $("wg_current");
  const lengthEl = $("wg_length");
  const voltageEl = $("wg_voltage");
  const dropEl = $("wg_drop");

  const calcBtn = $("wg_calc");
  const resetBtn = $("wg_reset");
  const resultWrap = $("wg_result");
  const breakdown = $("wg_breakdown");

  // AWG to mm² reference table
  const awgTable = [
    { awg: 20, mm2: 0.52 },
    { awg: 18, mm2: 0.82 },
    { awg: 16, mm2: 1.31 },
    { awg: 14, mm2: 2.08 },
    { awg: 12, mm2: 3.31 },
    { awg: 10, mm2: 5.26 },
    { awg: 8,  mm2: 8.37 },
    { awg: 6,  mm2: 13.3 },
    { awg: 4,  mm2: 21.1 },
    { awg: 2,  mm2: 33.6 },
    { awg: 1,  mm2: 42.4 },
    { awg: 0,  mm2: 53.5 },
    { awg: -1, mm2: 67.4 },   // 00 AWG
    { awg: -2, mm2: 85.0 },   // 000 AWG
    { awg: -3, mm2: 107.0 }   // 0000 AWG
  ];

  // Restrict input to numbers with decimals
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = msg ? "block" : "none"; }
  }

  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => { e.textContent = ""; e.style.display = "none"; });
  }

  function nearestAWG(requiredMm2) {
    for (let i = 0; i < awgTable.length; i++) {
      if (awgTable[i].mm2 >= requiredMm2) return awgTable[i];
    }
    return awgTable[awgTable.length - 1]; // return thickest
  }

  function calculate() {
    clearErrors();

    const I = parseFloat(currentEl.value);
    const L = parseFloat(lengthEl.value);
    const V = parseFloat(voltageEl.value);
    const dropPct = parseFloat(dropEl.value);

    if (!I || I <= 0) { showError(currentEl, "Enter valid current."); return; }
    if (!L || L <= 0) { showError(lengthEl, "Enter valid distance."); return; }
    if (!V || V <= 0) { showError(voltageEl, "Enter valid voltage."); return; }
    if (!dropPct || dropPct <= 0) { showError(dropEl, "Enter acceptable voltage drop."); return; }

    const allowedDropV = (dropPct / 100) * V;

    // **Real formula for required wire cross-section**
    // R = (Voltage Drop) / (Current × Total Length)
    // Resistivity Cu = 0.0172 Ω·mm²/m
    const rho = 0.0172;
    const totalLength = L * 2;

    const requiredMm2 = (rho * totalLength * I) / allowedDropV;

    // Calculate voltage drop in the chosen wire size (nearest AWG)
    const recommended = nearestAWG(requiredMm2);
    const wireR = (rho * totalLength) / recommended.mm2;
    const voltageDropActual = I * wireR;
    const dropPctActual = (voltageDropActual / V) * 100;
    const powerLoss = I * voltageDropActual;

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Recommended Wire Size</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Required Minimum:</strong> ${requiredMm2.toFixed(2)} mm²</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Suggested AWG:</strong> ${recommended.awg < 0 ? (Math.abs(recommended.awg) + " / 0 AWG") : recommended.awg}</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Suggested mm²:</strong> ${recommended.mm2} mm²</p>`);
    lines.push(`<hr>`);

    lines.push(`<h3 class="fade-left ad4">Performance With Suggested Wire</h3>`);
    lines.push(`<p class="fade-left ad5"><strong>Voltage Drop:</strong> ${voltageDropActual.toFixed(3)} V (${dropPctActual.toFixed(2)}%)</p>`);
    lines.push(`<p class="fade-left ad6"><strong>Power Loss:</strong> ${powerLoss.toFixed(2)} W</p>`);
    lines.push(`<p class="small fade-left ad7">Lower voltage drop = less heat, better performance, and longer wire lifespan.</p>`);

    // warnings
    if (dropPctActual > dropPct) {
      lines.push(`<p class="fade-left ad8" style="color:red"><strong>⚠️ Voltage drop exceeds your target. Consider thicker wire.</strong></p>`);
    }

    if (recommended.mm2 < 2.5 && I > 15) {
      lines.push(`<p class="fade-left ad9" style="color:red"><strong>⚠️ Load too high for thin wires — overheating risk.</strong></p>`);
    }

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    currentEl.value = "";
    lengthEl.value = "";
    voltageEl.value = "";
    dropEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();






// VOLTAGE DROP CALCULATOR (DC CIRCUITS)
(function () {
  const root = document.getElementById("voltage_drop_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const voltageEl = $("vdc_voltage");
  const currentEl = $("vdc_current");
  const lengthEl = $("vdc_length");
  const materialEl = $("vdc_material");

  const calcBtn = $("vdc_calc");
  const resetBtn = $("vdc_reset");
  const resultWrap = $("vdc_result");
  const breakdown = $("vdc_breakdown");

  // AWG reference table (AWG → mm²)
  const awgTable = [
    { awg: 20, mm2: 0.52 },
    { awg: 18, mm2: 0.82 },
    { awg: 16, mm2: 1.31 },
    { awg: 14, mm2: 2.08 },
    { awg: 12, mm2: 3.31 },
    { awg: 10, mm2: 5.26 },
    { awg: 8,  mm2: 8.37 },
    { awg: 6,  mm2: 13.3 },
    { awg: 4,  mm2: 21.1 },
    { awg: 2,  mm2: 33.6 },
    { awg: 1,  mm2: 42.4 },
    { awg: 0,  mm2: 53.5 },
    { awg: -1, mm2: 67.4 },   // 00 AWG
    { awg: -2, mm2: 85.0 },   // 000 AWG
    { awg: -3, mm2: 107.0 }   // 0000 AWG
  ];

  // Restrict to numbers + decimals
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error system
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = msg ? "block" : "none"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  function nearestAWG(mm2) {
    for (const row of awgTable) {
      if (row.mm2 >= mm2) return row;
    }
    return awgTable[awgTable.length - 1]; // thickest
  }

  function calculate() {
    clearErrors();

    const V = parseFloat(voltageEl.value);
    const I = parseFloat(currentEl.value);
    const L = parseFloat(lengthEl.value);

    if (!V || V <= 0) { showError(voltageEl, "Enter system voltage."); return; }
    if (!I || I <= 0) { showError(currentEl, "Enter current."); return; }
    if (!L || L <= 0) { showError(lengthEl, "Enter wire length."); return; }

    const material = materialEl.value;

    // Resistivity (Ω·mm²/m)
    const rho = material === "cu" ? 0.0172 : 0.0282; // copper vs aluminum

    const roundTrip = L * 2;

    // Choose mm² by limiting max 3% drop for calculation
    const maxDropV = V * 0.03;

    const requiredMm2 = (rho * roundTrip * I) / maxDropV;

    // actual drop using nearest AWG
    const recommended = nearestAWG(requiredMm2);

    const R = (rho * roundTrip) / recommended.mm2;
    const dropV = I * R;
    const dropPct = (dropV / V) * 100;
    const powerLoss = I * dropV;

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Voltage Drop Result</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Voltage Drop:</strong> ${dropV.toFixed(3)} V (${dropPct.toFixed(2)}%)</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Power Lost as Heat:</strong> ${powerLoss.toFixed(2)} W</p>`);
    lines.push(`<hr>`);

    lines.push(`<h3 class="fade-left ad3">Recommended Wire Size</h3>`);
    lines.push(`<p class="fade-left ad4"><strong>Minimum Required:</strong> ${requiredMm2.toFixed(2)} mm²</p>`);
    lines.push(`<p class="fade-left ad5"><strong>Recommended AWG:</strong> ${recommended.awg < 0 ? (Math.abs(recommended.awg) + "/0 AWG") : recommended.awg}</p>`);
    lines.push(`<p class="fade-left ad6"><strong>Wire Cross-Section:</strong> ${recommended.mm2} mm²</p>`);

    if (material === "al") {
      lines.push(`<p class="small fade-left ad7" style="color:#d9534f">⚠ Aluminum wire has higher resistance — always use thicker size than copper.</p>`);
    }

    if (dropPct > 3) {
      lines.push(`<p class="fade-left ad8" style="color:red"><strong>⚠ Voltage drop higher than recommended 2–3%. Use thicker wire.</strong></p>`);
    }

    lines.push(`<p class="small fade-left ad9">Lower voltage drop means cooler wire, higher efficiency, and better system performance.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    voltageEl.value = "";
    currentEl.value = "";
    lengthEl.value = "";
    materialEl.value = "cu";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// FUSE RATING CALCULATOR
(function () {
  const root = document.getElementById("fuse_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const currentEl = $("fs_current");
  const wireEl = $("fs_wire");
  const voltageEl = $("fs_voltage");

  const calcBtn = $("fs_calc_btn");
  const resetBtn = $("fs_reset_btn");
  const resultWrap = $("fs_result");
  const breakdown = $("fs_breakdown");

  // AWG to safe max current (standard NEC ampacity reference)
  const awgAmpacity = {
    22: 7,
    20: 11,
    18: 16,
    16: 22,
    14: 32,
    12: 41,
    10: 55,
    8: 73,
    6: 101,
    4: 135,
    2: 181
  };

  // number + decimal sanitization
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = msg ? "block" : "none"; }
  }

  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(err => {
      err.textContent = "";
      err.style.display = "none";
    });
  }

  function calculate() {
    clearErrors();

    const I = parseFloat(currentEl.value);
    if (!I || I <= 0) { showError(currentEl, "Enter valid current."); return; }

    const awg = parseFloat(wireEl.value) || null;
    const V = parseFloat(voltageEl.value) || null;

    // Step 1 → Fuse rating = 125% to 150% of continuous load
    const fuseMin = I * 1.25;
    const fuseMax = I * 1.50;

    // Choose market fuse size (nearest standard)
    const fuseSizes = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300];
    const recommended = fuseSizes.find(f => f >= fuseMin) || fuseSizes[fuseSizes.length - 1];

    let lines = [];
    lines.push(`<h2 class="fade-left"><strong>Recommended Fuse Rating</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Continuous Load:</strong> ${I} A</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Fuse Range (safe):</strong> ${fuseMin.toFixed(1)} – ${fuseMax.toFixed(1)} A</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Recommended Fuse:</strong> ${recommended} A</p>`);
    lines.push(`<hr>`);

    // Step 2 → Wire safety check
    if (awg) {
      const allowed = awgAmpacity[awg];
      if (allowed) {
        lines.push(`<p class="fade-left ad4"><strong>Wire Gauge:</strong> AWG ${awg}</p>`);
        lines.push(`<p class="fade-left ad5"><strong>Max Safe Wire Current:</strong> ${allowed} A</p>`);

        if (recommended > allowed) {
          lines.push(`<p class="fade-left ad6" style="color:red"><strong>⚠️ Fuse too large for this wire — overheating and fire risk!</strong></p>`);
          lines.push(`<p class="fade-left ad7 small">Choose thicker wire or smaller fuse.</p>`);
        } else {
          lines.push(`<p class="fade-left ad8" style="color:green"><strong>✓ Fuse is safe for the selected wire gauge.</strong></p>`);
        }
      } else {
        lines.push(`<p class="small fade-left ad9">Unknown AWG size — skipping wire safety check.</p>`);
      }
      lines.push(`<hr>`);
    }

    // Step 3 → Fuse category based on voltage
    if (V) {
      let category = "Low-Voltage Automotive / Blade Fuse";
      if (V > 60) category = "High-Voltage DC Fuse (ANL / MIDI / MEGA)";
      if (V > 100) category = "EV-Rated HV Fuse (DC Rated 250-500V)";

      lines.push(`<h3 class="fade-left ad10">Fuse Type Recommendation</h3>`);
      lines.push(`<p class="fade-left ad11">${category}</p>`);
    }

    // Step 4 → Additional advice
    lines.push(`<p class="small fade-left ad12">Fuses protect wires from fire, not devices. Always size fuse to wire capacity.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    currentEl.value = "";
    wireEl.value = "";
    voltageEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();








// MOTOR Kv <-> Kt CONVERTER
(function () {
  const root = document.getElementById('motor_kv_kt_calc');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);

  const kvEl = $('mk_kv');
  const ktEl = $('mk_kt');
  const voltageEl = $('mk_voltage');
  const currentEl = $('mk_current');
  const gearEl = $('mk_gear');
  const wheelREl = $('mk_wheel_radius');
  const effEl = $('mk_eff');

  const calcBtn = $('mk_calc');
  const resetBtn = $('mk_reset');
  const resultWrap = $('mk_result');
  const breakdown = $('mk_breakdown');


  function showError(el, msg) {
    const err = el.parentElement.querySelector('.error-message');
    if (err) {
      err.textContent = msg;
      err.style.display = msg ? 'block' : 'none';
    }
  }
  function clearErrors() {
    root.querySelectorAll('.error-message').forEach(e => { e.textContent = ''; e.style.display = 'none'; });
  }

  // Constants
  const K_CONST = 60 / (2 * Math.PI); // ≈ 9.549296585

  function calculate() {
    clearErrors();
    resultWrap.hidden = true;

    const kvRaw = kvEl.value.trim();
    const ktRaw = ktEl.value.trim();

    // Need at least one of Kv or Kt
    if (kvRaw === '' && ktRaw === '') {
      showError(kvEl, 'Enter Kv (RPM/V) or Kt (Nm/A).');
      showError(ktEl, 'Enter Kv (RPM/V) or Kt (Nm/A).');
      return;
    }

    // Parse values if present
    const kv = kvRaw !== '' ? parseFloat(kvRaw) : null;
    const kt = ktRaw !== '' ? parseFloat(ktRaw) : null;

    // Validate positive if provided
    if (kv !== null && (!isFinite(kv) || kv <= 0)) { showError(kvEl, 'Kv must be > 0'); return; }
    if (kt !== null && (!isFinite(kt) || kt <= 0)) { showError(ktEl, 'Kt must be > 0'); return; }

    // Convert between Kv and Kt
    let calcKv = kv;
    let calcKt = kt;

    if (kv !== null && kt === null) {
      // Kv -> Kt
      calcKt = K_CONST / kv;
    } else if (kt !== null && kv === null) {
      // Kt -> Kv
      calcKv = K_CONST / kt;
    } else {
      // both provided — cross-check consistency (tolerant)
      const impliedKt = K_CONST / kv;
      const impliedKv = K_CONST / kt;
      // if mismatch > 5% warn user
      const mismatch = Math.abs(impliedKt - kt) / impliedKt;
      if (mismatch > 0.05) {
        showError(ktEl, 'Provided Kv and Kt differ by >5% — check inputs.');
        // continue calculation using Kv input as source of truth
        calcKt = impliedKt;
        calcKv = kv;
      } else {
        // accept inputs (average to reduce rounding)
        calcKt = (impliedKt + kt) / 2;
        calcKv = (impliedKv + kv) / 2;
      }
    }

    // Derived units
    const kv_rad_per_V = calcKv * 2 * Math.PI / 60; // rad/s per V
    const kt_ozin_per_A = calcKt * 141.611932; // 1 Nm = 141.611932 oz·in

    // Optional computations
    const V = voltageEl.value.trim() !== '' ? parseFloat(voltageEl.value) : null;
    const I = currentEl.value.trim() !== '' ? parseFloat(currentEl.value) : null;
    const gear = gearEl.value.trim() !== '' ? parseFloat(gearEl.value) : 1;
    const wheelR = wheelREl.value.trim() !== '' ? parseFloat(wheelREl.value) : null;
    const eff = effEl.value.trim() !== '' ? parseFloat(effEl.value) : 0.95;

    if (V !== null && (!isFinite(V) || V <= 0)) { showError(voltageEl, 'Voltage must be > 0'); return; }
    if (I !== null && (!isFinite(I) || I < 0)) { showError(currentEl, 'Current must be ≥ 0'); return; }
    if (gear !== null && (!isFinite(gear) || gear <= 0)) { showError(gearEl, 'Gear ratio must be > 0'); return; }
    if (wheelR !== null && (!isFinite(wheelR) || wheelR <= 0)) { showError(wheelREl, 'Wheel radius must be > 0'); return; }
    if (eff !== null && (!isFinite(eff) || eff <= 0 || eff > 1.5)) { showError(effEl, 'Efficiency should be 0.5–1.0 (use 0.95 default)'); return; }

    // Prepare output lines
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Conversion</strong></h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Kv (RPM/V):</strong> ${calcKv.toFixed(3)} rpm/V</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Kt (Nm/A):</strong> ${calcKt.toFixed(5)} Nm/A</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Kv (rad/s per V):</strong> ${kv_rad_per_V.toFixed(3)} rad·s⁻¹·V⁻¹</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Kt (oz·in / A):</strong> ${kt_ozin_per_A.toFixed(2)} oz·in/A</p>`);

    // If voltage provided -> no-load speed
    if (V !== null) {
      const noLoadRPM = calcKv * V;
      const noLoadRad = noLoadRPM * 2 * Math.PI / 60;
      lines.push(`<p class="fade-left ad5"><strong>No-load speed:</strong> ${noLoadRPM.toFixed(0)} rpm (${(noLoadRPM/1000).toFixed(3)} krpm) — ${ (noLoadRad.toFixed(0)) } rad/s</p>`);
    }

    // If current provided -> motor torque and power
    let motorTorque = null;
    if (I !== null) {
      motorTorque = calcKt * I; // Nm
      lines.push(`<p class="fade-left ad6"><strong>Motor torque (stall at ${I} A):</strong> ${motorTorque.toFixed(3)} Nm</p>`);
    }

    // Wheel / gearbox calculations (optional)
    if (motorTorque !== null || V !== null) {
      // compute motorRPM if V present
      const motorRPM = V !== null ? calcKv * V : null;

      if (motorTorque !== null) {
        const wheelTorque = motorTorque * gear * eff; // multiply by gear ratio and drivetrain eff
        lines.push(`<p class="fade-left ad7"><strong>Wheel torque (after ${gear} : 1 gear & ${ (eff*100).toFixed(0) }% eff):</strong> ${wheelTorque.toFixed(3)} Nm</p>`);

        if (wheelR !== null) {
          const wheelForce = wheelTorque / wheelR; // N
          lines.push(`<p class="fade-left ad8"><strong>Wheel linear force:</strong> ${wheelForce.toFixed(2)} N</p>`);
        }
      }

      if (motorRPM !== null && wheelR !== null) {
        const wheelRPM = motorRPM / gear;
        const wheelCirc = 2 * Math.PI * wheelR; // meters
        const mPerMin = wheelCirc * wheelRPM;
        const kmh = (mPerMin * 60) / 1000;
        lines.push(`<p class="fade-left ad9"><strong>Wheel speed:</strong> ${kmh.toFixed(2)} km/h (wheel RPM: ${wheelRPM.toFixed(1)} rpm)</p>`);
      }

      // Power estimate if both torque and speed available
      if (motorTorque !== null && motorRPM !== null) {
        const omega = motorRPM * 2 * Math.PI / 60; // rad/s
        const mechP = motorTorque * omega; // W
        lines.push(`<p class="fade-left ad10"><strong>Mechanical power at motor:</strong> ${mechP.toFixed(0)} W</p>`);
      }
    }

    lines.push(`<p class="small fade-left ad11">Formula: Kt (Nm/A) = 60 / (2π × Kv). This assumes SI units and ideal motor (no losses). Use gearbox efficiency to estimate wheel torque.</p>`);

    breakdown.innerHTML = lines.join('');
    resultWrap.hidden = false;
  }

  function resetForm() {
    kvEl.value = '';
    ktEl.value = '';
    voltageEl.value = '';
    currentEl.value = '';
    gearEl.value = '';
    wheelREl.value = '';
    effEl.value = '';
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetForm);
})();









// DC MOTOR RPM CALCULATOR
(function () {
  const root = document.getElementById("dc_motor_rpm_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const kvEl = $("dcm_kv");
  const voltageEl = $("dcm_voltage");

  const calcBtn = $("dcm_calc");
  const resetBtn = $("dcm_reset");

  const resultWrap = $("dcm_result");
  const breakdown = $("dcm_breakdown");

  // Allow decimal input only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const parts = v.split(".");
      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) {
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
    resultWrap.hidden = true;

    const kv = parseFloat(kvEl.value);
    if (!kv || kv <= 0) {
      showError(kvEl, "Enter a valid Kv value.");
      return;
    }

    const voltage = parseFloat(voltageEl.value);
    if (!voltage || voltage <= 0) {
      showError(voltageEl, "Enter valid voltage.");
      return;
    }

    // DC motor RPM formula
    const rpm = kv * voltage;

    // Create result
    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Motor RPM:</strong> ${rpm.toFixed(0)} rpm</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Kv:</strong> ${kv} RPM per Volt</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Voltage:</strong> ${voltage} V</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Formula:</strong> RPM = Kv × Voltage</p>`);

    lines.push(`<p class="small fade-left ad4">Note: This is no-load RPM. Under real load, RPM is 10–20% lower.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    kvEl.value = "";
    voltageEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// MOTOR KV CALCULATOR
(function () {
  const root = document.getElementById("motor_kv_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const rpmEl = $("mk_rpm");
  const voltageEl = $("mk_voltage");

  const calcBtn = $("mk_calc");
  const resetBtn = $("mk_reset");

  const resultWrap = $("mk_result");
  const breakdown = $("mk_breakdown");

  // Allow numeric + decimal input only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = msg ? "block" : "none"; }
  }

  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  function calculate() {
    clearErrors();
    resultWrap.hidden = true;

    const rpm = parseFloat(rpmEl.value);
    if (!rpm || rpm <= 0) {
      showError(rpmEl, "Enter valid RPM.");
      return;
    }

    const voltage = parseFloat(voltageEl.value);
    if (!voltage || voltage <= 0) {
      showError(voltageEl, "Enter valid voltage.");
      return;
    }

    // Kv calculation
    const kv = rpm / voltage;

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Motor Kv:</strong> ${kv.toFixed(2)} RPM/V</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>No-Load RPM:</strong> ${rpm} rpm</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Voltage:</strong> ${voltage} V</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Formula:</strong> Kv = RPM ÷ Voltage</p>`);
    lines.push(`<hr>`);
    lines.push(`<p class="small fade-left ad4">Note: Kv is calculated from no-load RPM. Loaded RPM will be 10–20% lower.</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    rpmEl.value = "";
    voltageEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// EV CHARGING TIME CALCULATOR
(function () {
  const root = document.getElementById("ev_charging_time_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const batteryEl = $("ev_battery");
  const chargerEl = $("ev_charger");
  const effEl = $("ev_eff");

  const calcBtn = $("ev_calc_btn");
  const resetBtn = $("ev_reset_btn");

  const resultWrap = $("ev_result");
  const breakdown = $("ev_breakdown");

  // Decimal-only input filter
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      inp.value = v;
    });
  });

  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) {
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
    resultWrap.hidden = true;

    const battery = parseFloat(batteryEl.value);
    if (!battery || battery <= 0) {
      showError(batteryEl, "Enter valid battery capacity.");
      return;
    }

    const charger = parseFloat(chargerEl.value);
    if (!charger || charger <= 0) {
      showError(chargerEl, "Enter valid charger power.");
      return;
    }

    let eff = parseFloat(effEl.value);
    if (!eff || eff <= 0 || eff > 100) eff = 90; // default 90%

    const efficiencyFactor = eff / 100;

    // Charging time formula
    const timeHours = battery / (charger * efficiencyFactor);

    const timeMinutes = timeHours * 60;

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Charging Time:</strong> ${timeHours.toFixed(2)} hours</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>≈ ${timeMinutes.toFixed(0)} minutes</strong></p>`);
    lines.push(`<p class="fade-left ad2"><strong>Battery Capacity:</strong> ${battery} kWh</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Charger Power:</strong> ${charger} kW</p>`);
    lines.push(`<p class="fade-left ad4"><strong>Charging Efficiency:</strong> ${eff}%</p>`);
    lines.push(`<p class="small fade-left ad5">
      Note: EV chargers rarely achieve 100% efficiency. Realistic values are 85%–93%.
    </p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    batteryEl.value = "";
    chargerEl.value = "";
    effEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// EV RANGE LOSS IN TEMPERATURE CALCULATOR
(function () {
  const root = document.getElementById("ev_temp_range_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const baseRangeEl = $("evtr_base_range");
  const tempEl = $("evtr_temp");
  const calcBtn = $("evtr_calc");
  const resetBtn = $("evtr_reset");
  const resultWrap = $("evtr_result");
  const breakdown = $("evtr_breakdown");

  // Allow decimal input only
  root.querySelectorAll("input[type=number]").forEach(inp => {
    inp.addEventListener("input", () => {
      let v = inp.value.replace(/[^0-9.-]/g, "");
      // Prevent multiple dots or minus in wrong places
      if (v.split(".").length > 2) v = v.replace(/\.+$/, "");
      if ((v.match(/-/g) || []).length > 1) v = v.replace(/-+$/, "");
      if (v.startsWith(".")) v = "0" + v;
      inp.value = v;
    });
  });

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = msg ? "block" : "none"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // Temperature → Efficiency Loss Curve (%)
  function tempLossCurve(temp) {
    const data = [
      { t: -20, loss: 45 },
      { t: -10, loss: 35 },
      { t: 0,   loss: 20 },
      { t: 10,  loss: 10 },
      { t: 20,  loss: 0 },
      { t: 30,  loss: 5 },
      { t: 40,  loss: 12 }
    ];

    // If outside bounds, clamp
    if (temp <= -20) return 45;
    if (temp >= 40) return 12;

    // Linear interpolation between closest points
    for (let i = 0; i < data.length - 1; i++) {
      const p1 = data[i];
      const p2 = data[i+1];
      if (temp >= p1.t && temp <= p2.t) {
        const ratio = (temp - p1.t) / (p2.t - p1.t);
        return p1.loss + (p2.loss - p1.loss) * ratio;
      }
    }
    return 0;
  }

  function calculate() {
    clearErrors();
    resultWrap.hidden = true;

    const baseRange = parseFloat(baseRangeEl.value);
    if (!baseRange || baseRange <= 0) {
      showError(baseRangeEl, "Enter a valid base range.");
      return;
    }

    const temp = parseFloat(tempEl.value);
    if (temp === "" || isNaN(temp)) {
      showError(tempEl, "Enter a valid temperature.");
      return;
    }

    const lossPercent = tempLossCurve(temp);
    const reducedRange = baseRange * (1 - lossPercent / 100);

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Estimated Range:</strong> ${reducedRange.toFixed(1)} km</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Temperature:</strong> ${temp}°C</p>`);
    lines.push(`<p class="fade-left ad2"><strong>Efficiency Loss:</strong> ${lossPercent.toFixed(1)}%</p>`);
    lines.push(`<p class="fade-left ad3"><strong>Original Range:</strong> ${baseRange} km</p>`);
    lines.push(`<hr>`);

    let note = "";
    if (temp < 0) note = "Cold batteries have higher internal resistance and reduced regen braking.";
    else if (temp > 30) note = "Hot weather increases AC load and battery cooling demand.";
    else note = "Temperature is within optimal range.";

    lines.push(`<p class="small fade-left ad4">${note}</p>`);

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    baseRangeEl.value = "";
    tempEl.value = "";
    clearErrors();
    resultWrap.hidden = true;
  }

  calcBtn.addEventListener("click", calculate);
  resetBtn.addEventListener("click", resetForm);
})();







// EV TIRE SIZE DIFFERENCE CALCULATOR
(function () {
  const root = document.getElementById("ev_tire_diff_calc");
  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const oldEl = $("etd_old");
  const newEl = $("etd_new");
  const speedEl = $("etd_speed");

  const calcBtn = $("etd_calc");
  const resetBtn = $("etd_reset");
  const resultWrap = $("etd_result");
  const breakdown = $("etd_breakdown");

  // Allow decimal input for speed field only
  if (speedEl) {
    speedEl.addEventListener("input", () => {
      let v = speedEl.value.replace(/[^0-9.]/g, "");
      if (v.startsWith(".")) v = "0" + v;
      const p = v.split(".");
      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
      speedEl.value = v;
    });
  }

  // Error helpers
  function showError(el, msg) {
    const err = el.parentElement.querySelector(".error-message");
    if (err) { err.textContent = msg; err.style.display = msg ? "block" : "none"; }
  }
  function clearErrors() {
    root.querySelectorAll(".error-message").forEach(e => {
      e.textContent = "";
      e.style.display = "none";
    });
  }

  // Parse tire: 205/55R16 → {width, aspect, rim}
  function parseTire(str) {
    const re = /^(\d{3})\/(\d{2})R(\d{2})$/i;
    const m = str.trim().match(re);
    if (!m) return null;
    return {
      width: parseFloat(m[1]),     // mm
      aspect: parseFloat(m[2]),    // %
      rim: parseFloat(m[3])        // inch
    };
  }

  // Convert tire to diameter (mm)
  function tireDiameter(t) {
    const sidewall = (t.width * (t.aspect / 100)) * 2; // mm
    const rim = t.rim * 25.4; // inch → mm
    return sidewall + rim;
  }

  function calculate() {
    clearErrors();
    resultWrap.hidden = true;

    const oldT = parseTire(oldEl.value);
    if (!oldT) { showError(oldEl, "Invalid tire format."); return; }

    const newT = parseTire(newEl.value);
    if (!newT) { showError(newEl, "Invalid tire format."); return; }

    const oldDia = tireDiameter(oldT);
    const newDia = tireDiameter(newT);

    const diff = ((newDia - oldDia) / oldDia) * 100;

    // Speed correction
    const shownSpeed = parseFloat(speedEl.value);
    let actualSpeed = null;
    if (shownSpeed && shownSpeed > 0) {
      actualSpeed = shownSpeed * (newDia / oldDia);
    }

    // Range change estimate:
    // +1% tire diameter → +1% rolling distance, -1% torque, +1–2% drag
    let rangeChange = 0;
    if (diff > 0) rangeChange = diff * 1.2;      // bigger tire = more drag
    else rangeChange = diff * 0.8;               // smaller tire = efficiency gain

    const lines = [];

    lines.push(`<h2 class="fade-left"><strong>Diameter Difference:</strong> ${diff.toFixed(2)}%</h2>`);
    lines.push(`<p class="fade-left ad1"><strong>Old Diameter:</strong> ${oldDia.toFixed(1)} mm</p>`);
    lines.push(`<p class="fade-left ad2"><strong>New Diameter:</strong> ${newDia.toFixed(1)} mm</p>`);

    if (actualSpeed !== null) {
      lines.push(`<p class="fade-left ad3"><strong>Actual Speed:</strong> ${actualSpeed.toFixed(1)} km/h</p>`);
      lines.push(`<p class="small fade-left ad4">Because new tire diameter affects wheel rotations per km.</p>`);
    }

    lines.push(`<hr>`);
    lines.push(`<h3 class="fade-left ad5"><strong>Estimated Range Change:</strong> ${rangeChange.toFixed(1)}%</h3>`);

    if (diff > 0) {
      lines.push(`<p class="small fade-left ad6">Bigger tires reduce torque and increase energy usage.</p>`);
    } else {
      lines.push(`<p class="small fade-left ad7">Smaller tires improve efficiency but reduce top speed.</p>`);
    }

    breakdown.innerHTML = lines.join("");
    resultWrap.hidden = false;
  }

  function resetForm() {
    oldEl.value = "";
    newEl.value = "";
    speedEl.value = "";
    resultWrap.hidden = true;
    clearErrors();
  }

  calcBtn.addEventListener("click", calculate);
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







// Header Social Share Button 
const pageURL = window.location.href;
const pageTitle = document.title;
const pageDescription = "Best place to buy batteries online!";
const pageImage = "https://batterywheel.com/images/logo.jpg"; // Replace with your image URL for Pinterest

document.querySelector('.social-icon.facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${pageURL}`;
document.querySelector('.social-icon.twitter').href = `https://twitter.com/intent/tweet?url=${pageURL}&text=${pageTitle}`;
document.querySelector('.social-icon.linkedin').href = `https://www.linkedin.com/shareArticle?mini=true&url=${pageURL}&title=${pageTitle}&summary=${pageDescription}`;
document.querySelector('.social-icon.whatsapp').href = `https://wa.me/?text=${pageTitle} ${pageURL}`;
document.querySelector('.social-icon.pinterest').href = `https://pinterest.com/pin/create/button/?url=${pageURL}&media=${pageImage}&description=${pageDescription}`;
document.querySelector('.social-icon.reddit').href = `https://www.reddit.com/submit?url=${pageURL}&title=${pageTitle}`;
document.querySelector('.social-icon.telegram').href = `https://t.me/share/url?url=${pageURL}&text=${pageDescription}`;
document.querySelector('.social-icon.tumblr').href = `https://www.tumblr.com/share/link?url=${pageURL}&name=${pageTitle}&description=${pageDescription}`;




















