// charts.js — small canvas charts drawn with no library, so the first load stays light.
// Every chart is drawn from plain numbers and redrawn whenever its view renders.

function setupCanvas(canvas, width, height) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function moneyShort(value) {
  if (Math.abs(value) >= 1000) return "$" + (value / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return "$" + Math.round(value);
}

// Donut: shares of spending by category. slices = [{label, value, color}]
// Kept compact (210px) so the dashboard's trend chart below it still shows
// inside a 1280x800 viewport.
export function drawDonut(canvas, slices, total) {
  const width = canvas.clientWidth || 320;
  const height = 210;
  const ctx = setupCanvas(canvas, width, height);
  const cx = width / 2;
  const cy = height / 2;
  const outer = 86;
  const inner = 54;
  let start = -Math.PI / 2;
  for (const slice of slices) {
    const angle = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outer, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    start += angle;
  }
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  // The center label is the HTML overlay (.chart-center) beside the canvas,
  // so the canvas draws only the ring — drawing text here would double it.
}

// Bars: one bar per month, income vs spending. months = [{label, income, spent}]
// Kept compact (200px) so the card fits the first viewport on the dashboard.
export function drawBars(canvas, months) {
  const width = canvas.clientWidth || 640;
  const height = 200;
  const ctx = setupCanvas(canvas, width, height);
  const padLeft = 44;
  const padBottom = 26;
  const padTop = 12;
  const plotW = width - padLeft - 8;
  const plotH = height - padTop - padBottom;
  const max = Math.max(...months.map((m) => Math.max(m.income, m.spent))) * 1.08;
  const groupW = plotW / months.length;
  const barW = Math.min(22, (groupW - 14) / 2);

  ctx.strokeStyle = "#e4ded2";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#6d7a72";
  ctx.font = "11px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (plotH * i) / 4;
    const value = max * (1 - i / 4);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - 8, y);
    ctx.stroke();
    ctx.fillText(moneyShort(value), padLeft - 8, y);
  }

  months.forEach((m, i) => {
    const x = padLeft + groupW * i + (groupW - barW * 2 - 4) / 2;
    const incomeH = (m.income / max) * plotH;
    const spentH = (m.spent / max) * plotH;
    ctx.fillStyle = "#166534";
    ctx.beginPath();
    ctx.roundRect(x, padTop + plotH - incomeH, barW, incomeH, [3, 3, 0, 0]);
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(x + barW + 4, padTop + plotH - spentH, barW, spentH, [3, 3, 0, 0]);
    ctx.fill();
    ctx.fillStyle = "#43524a";
    ctx.font = "700 11px -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(m.label, padLeft + groupW * i + groupW / 2, height - 8);
  });

  ctx.textAlign = "left";
  ctx.font = "700 12px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#166534";
  ctx.fillText("■ Income", padLeft, 10);
  ctx.fillStyle = "#dc2626";
  ctx.fillText("■ Spent", padLeft + 78, 10);
}
