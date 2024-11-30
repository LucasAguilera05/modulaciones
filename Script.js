document.getElementById("generateSignal").addEventListener("click", generateSignal);

function generateSignal() {
  const bitsInput = document.getElementById("bitsInput").value;
  const modulationType = document.getElementById("modulationType").value;
  const TsInput = parseFloat(document.getElementById("symbolTimeInput").value);

  // Validaciones
  if (!bitsInput.match(/^[01]+$/)) {
    alert("Por favor, ingrese una secuencia de bits válida (solo 0 y 1).");
    return;
  }

  if (isNaN(TsInput) || TsInput <= 0) {
    alert("Por favor, ingrese un tiempo de símbolo válido (mayor a 0).");
    return;
  }

  const Ts = TsInput; // Tiempo de símbolo
  const bits = bitsInput.split("").map(Number);
  let signalData = [];
  let constellationData = [];
  let bitAnnotations = [];

  // Selección de modulación
  switch (modulationType) {
    case "ASK":
      [signalData, constellationData, bitAnnotations] = modulateASK(bits, Ts);
      break;
    case "PSK":
      [signalData, constellationData, bitAnnotations] = modulatePSK(bits, 2, Ts);
      break;
    case "FSK":
      [signalData, constellationData, bitAnnotations] = modulateFSK(bits, Ts);
      break;
    case "4PSK":
      [signalData, constellationData, bitAnnotations] = modulatePSK(bits, 4, Ts);
      break;
    case "4QAM":
      [signalData, constellationData, bitAnnotations] = modulateQAM(bits, 4, Ts);
      break;
    case "8QAM":
      [signalData, constellationData, bitAnnotations] = modulateQAM(bits, 8, Ts);
      break;
    default:
      alert("Tipo de modulación no soportado.");
      return;
  }

  // Graficar
  plotSignal(signalData, bitAnnotations);
  plotConstellation(constellationData);
}

// Modulación ASK
function modulateASK(bits, Ts) {
  const fc = 2000; // Frecuencia de portadora
  const fs = 10000; // Frecuencia de muestreo

  const t = Array.from({ length: bits.length * fs * Ts }, (_, i) => i / fs);
  const signal = t.map((time) =>
    bits[Math.floor(time / Ts)] * Math.sin(2 * Math.PI * fc * time)
  );

  const bitAnnotations = bits.map((bit, i) => ({
    x: i * Ts + Ts / 2,
    y: 1.5,
    text: bit.toString(),
    showarrow: false,
    font: { color: "red", size: 12 },
  }));

  return [t.map((_, i) => [t[i], signal[i]]), [], bitAnnotations];
}

// Modulación PSK
function modulatePSK(bits, M, Ts) {
  const fc = 2000;
  const fs = 10000;
  const phaseStep = (2 * Math.PI) / M;

  const t = Array.from({ length: bits.length * fs * Ts }, (_, i) => i / fs);
  const signal = t.map((time) => {
    const symbolIndex = Math.floor(time / Ts) % bits.length;
    const phase = bits[symbolIndex] * phaseStep;
    return Math.sin(2 * Math.PI * fc * time + phase);
  });

  const bitAnnotations = bits.map((bit, i) => ({
    x: i * Ts + Ts / 2,
    y: 1.5,
    text: bit.toString(),
    showarrow: false,
    font: { color: "red", size: 12 },
  }));

  const constellation = Array.from({ length: M }, (_, i) => [
    Math.cos(i * phaseStep),
    Math.sin(i * phaseStep),
  ]);

  return [t.map((_, i) => [t[i], signal[i]]), constellation, bitAnnotations];
}

// Modulación FSK
function modulateFSK(bits, Ts) {
  const fc1 = 2000;
  const fc2 = 4000;
  const fs = 10000;

  const t = Array.from({ length: bits.length * fs * Ts }, (_, i) => i / fs);
  const signal = t.map((time) => {
    const symbol = bits[Math.floor(time / Ts)];
    const fc = symbol === 0 ? fc1 : fc2;
    return Math.sin(2 * Math.PI * fc * time);
  });

  const bitAnnotations = bits.map((bit, i) => ({
    x: i * Ts + Ts / 2,
    y: 1.5,
    text: bit.toString(),
    showarrow: false,
    font: { color: "red", size: 12 },
  }));

  return [t.map((_, i) => [t[i], signal[i]]), [], bitAnnotations];
}

// Modulación QAM (4-QAM y 8-QAM)
function modulateQAM(bits, M, Ts) {
  const fc = 2000; // Frecuencia de portadora
  const fs = 10000; // Frecuencia de muestreo

  const bitsPerSymbol = Math.log2(M); // Cantidad de bits por símbolo
  if (bits.length % bitsPerSymbol !== 0) {
    alert(`El número de bits debe ser múltiplo de ${bitsPerSymbol} para ${M}-QAM.`);
    return [[], [], []];
  }

  // Mapeo de símbolos para 4-QAM y 8-QAM
  const symbolMapping = {
    4: [
      [-1, -1], // 00
      [-1,  1], // 01
      [ 1, -1], // 10
      [ 1,  1], // 11
    ],
    8: [
      [-1,  0],                   // 000
      [-Math.sqrt(2), Math.sqrt(2)], // 001
      [ 0, -1],                   // 010
      [-Math.sqrt(2), -Math.sqrt(2)], // 011
      [ 1,  0],                   // 100
      [ Math.sqrt(2), Math.sqrt(2)], // 101
      [ 0,  1],                   // 110
      [ Math.sqrt(2), -Math.sqrt(2)], // 111
    ]
  };

  const symbols = [];
  for (let i = 0; i < bits.length; i += bitsPerSymbol) {
    const symbolBits = bits.slice(i, i + bitsPerSymbol).join("");
    const index = parseInt(symbolBits, 2);
    symbols.push(symbolMapping[M][index]);
  }

  const t = Array.from({ length: symbols.length * fs * Ts }, (_, i) => i / fs);
  const signal = t.map((time) => {
    const symbolIndex = Math.floor(time / Ts);
    const [real, imag] = symbols[symbolIndex];
    return (
      real * Math.cos(2 * Math.PI * fc * time) +
      imag * Math.sin(2 * Math.PI * fc * time)
    );
  });

  const constellation = symbolMapping[M];

  return [t.map((_, i) => [t[i], signal[i]]), constellation, []];
}

// Graficar señal modulada
function plotSignal(data, annotations) {
  const t = data.map(([x]) => x);
  const y = data.map(([, y]) => y);

  const trace = {
    x: t,
    y: y,
    type: "scatter",
    mode: "lines",
    line: { color: "#007bff" },
    name: "Señal Modulada",
  };

  const layout = {
    title: "Señal Modulada",
    xaxis: { title: "Tiempo (s)" },
    yaxis: { title: "Amplitud" },
    annotations: annotations,
  };

  // Graficar constelación
function plotConstellation(constellationData) {
    if (!constellationData || constellationData.length === 0) {
      const container = document.getElementById("constellationChart");
      container.innerHTML = "<p style='color: red;'>No hay datos de constelación disponibles.</p>";
      return;
    }
  
    const x = constellationData.map(([real]) => real);
    const y = constellationData.map(([, imag]) => imag);
  
    const trace = {
      x: x,
      y: y,
      mode: "markers",
      type: "scatter",
      marker: { color: "red", size: 10 },
      name: "Constelación",
    };
  
    const layout = {
      title: "Diagrama de Constelación",
      xaxis: { title: "Componente Real", range: [-2, 2] },
      yaxis: { title: "Componente Imaginaria", range: [-2, 2] },
      showlegend: false,
    };
  
    Plotly.newPlot("constellationChart", [trace], layout);
  }
  

  Plotly.newPlot("signalChart", [trace], layout);
}
