/**
 * High-DPI Canvas Flashcard Video Renderer
 * Renders Singapore PSLE Chinese Flashcards with Tianzige (田字格),
 * Animated countdowns, pinyin reveals, collocations, and customizable themes.
 */

export const THEMES = {
  exam: {
    id: "exam",
    name: "🇸🇬 MOE 官方考试风 (MOE Exam Crimson)",
    bgGradient: ["#F8FAFC", "#EEF2F6"],
    cardBg: "#FFFFFF",
    cardBorder: "#E2E8F0",
    primary: "#DC2626",      // Crimson
    secondary: "#1E293B",    // Navy dark
    accent: "#D97706",       // Amber
    gridColor: "rgba(220, 38, 38, 0.25)",
    textDark: "#0F172A",
    textMuted: "#64748B",
    pinyinColor: "#B91C1C",
    badgeBg: "#FEE2E2",
    badgeText: "#991B1B",
    glow: "rgba(220, 38, 38, 0.12)"
  },
  bamboo: {
    id: "bamboo",
    name: "🎋 清雅翠竹 (Jade Bamboo Study)",
    bgGradient: ["#F0FDF4", "#DCFCE7"],
    cardBg: "#FFFFFF",
    cardBorder: "#BBF7D0",
    primary: "#15803D",
    secondary: "#14532D",
    accent: "#CA8A04",
    gridColor: "rgba(21, 128, 61, 0.25)",
    textDark: "#052E16",
    textMuted: "#4B5563",
    pinyinColor: "#15803D",
    badgeBg: "#DCFCE7",
    badgeText: "#166534",
    glow: "rgba(21, 128, 61, 0.12)"
  },
  sunset: {
    id: "sunset",
    name: "🌅 晨曦活力 (Sunrise Coral)",
    bgGradient: ["#FFF7ED", "#FFEDD5"],
    cardBg: "#FFFFFF",
    cardBorder: "#FED7AA",
    primary: "#EA580C",
    secondary: "#7C2D12",
    accent: "#0284C7",
    gridColor: "rgba(234, 88, 12, 0.25)",
    textDark: "#431407",
    textMuted: "#6B7280",
    pinyinColor: "#EA580C",
    badgeBg: "#FFEDD5",
    badgeText: "#9A3412",
    glow: "rgba(234, 88, 12, 0.12)"
  },
  scholar: {
    id: "scholar",
    name: "📜 书香墨韵 (Scholar Parchment)",
    bgGradient: ["#FDFBF7", "#F5EFEB"],
    cardBg: "#FFFDF9",
    cardBorder: "#E5DCCE",
    primary: "#854D0E",
    secondary: "#292524",
    accent: "#991B1B",
    gridColor: "rgba(185, 28, 28, 0.22)",
    textDark: "#1C1917",
    textMuted: "#78716C",
    pinyinColor: "#991B1B",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
    glow: "rgba(133, 77, 14, 0.1)"
  },
  dark: {
    id: "dark",
    name: "🌌 极速夜航 (Cyber Slate Dark)",
    bgGradient: ["#0B0F19", "#111827"],
    cardBg: "#1F2937",
    cardBorder: "#374151",
    primary: "#38BDF8",
    secondary: "#F3F4F6",
    accent: "#FBBF24",
    gridColor: "rgba(56, 189, 248, 0.25)",
    textDark: "#F9FAFB",
    textMuted: "#9CA3AF",
    pinyinColor: "#38BDF8",
    badgeBg: "rgba(56, 189, 248, 0.15)",
    badgeText: "#7DD3FC",
    glow: "rgba(56, 189, 248, 0.15)"
  }
};

export const ASPECT_RATIOS = {
  "9:16": { width: 720, height: 1280, label: "📱 9:16 (Shorts / TikTok / Reels)" },
  "16:9": { width: 1280, height: 720, label: "💻 16:9 (Landscape / YouTube / TV)" },
  "1:1":  { width: 1080, height: 1080, label: "🔲 1:1 (Square / Instagram)" }
};

/**
 * Render a complete flashcard frame onto the target HTML5 canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Object} wordItem - The current vocabulary object
 * @param {Object} options - Rendering configuration
 */
export function renderFlashcardFrame(canvas, wordItem, options = {}) {
  const {
    aspectRatio = "9:16",
    themeId = "exam",
    phase = "reveal",      // "guess" (hide pinyin/meaning) or "reveal" (show all)
    countdownProgress = 1.0, // 0.0 to 1.0 (for timer ring / bar)
    cardIndex = 1,
    totalCards = 1,
    showTianzige = true,
    showCollocations = true,
    showSentence = true,
  } = options;

  const ctx = canvas.getContext("2d");
  const theme = THEMES[themeId] || THEMES.exam;
  const config = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["9:16"];

  if (canvas.width !== config.width || canvas.height !== config.height) {
    canvas.width = config.width;
    canvas.height = config.height;
  }

  const W = config.width;
  const H = config.height;
  const isPortrait = aspectRatio === "9:16";
  const isSquare = aspectRatio === "1:1";

  // 1. Draw Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(1, theme.bgGradient[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle background decorative pattern/dots
  ctx.fillStyle = theme.glow;
  for (let x = 30; x < W; x += 60) {
    for (let y = 30; y < H; y += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Draw Header
  const headerY = isPortrait ? 60 : (isSquare ? 50 : 40);
  ctx.textAlign = "center";

  // Category & Grade Badge
  const badgeText = `🇸🇬 PSLE 小六华文 · ${wordItem.unitCode || 'P6'}`;
  ctx.font = "bold 20px 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeHeight = 36;
  const badgeX = (W - badgeWidth) / 2;

  // Badge pill
  ctx.fillStyle = theme.badgeBg;
  drawRoundedRect(ctx, badgeX, headerY, badgeWidth, badgeHeight, 18);
  ctx.fill();

  ctx.fillStyle = theme.badgeText;
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, W / 2, headerY + badgeHeight / 2);

  // Chapter Name
  ctx.font = "500 18px 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillStyle = theme.textMuted;
  ctx.fillText(wordItem.unit || "新加坡小学华文课程", W / 2, headerY + badgeHeight + 25);

  // 3. Central Card Frame
  let cardX, cardY, cardW, cardH;
  if (isPortrait) {
    cardW = W - 60;
    cardH = H - 240;
    cardX = 30;
    cardY = headerY + 80;
  } else if (isSquare) {
    cardW = W - 80;
    cardH = H - 180;
    cardX = 40;
    cardY = headerY + 70;
  } else {
    // 16:9 Landscape
    cardW = W - 100;
    cardH = H - 140;
    cardX = 50;
    cardY = headerY + 60;
  }

  // Card Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;

  // Main Card Body
  ctx.fillStyle = theme.cardBg;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  // Card Border
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2;
  ctx.strokeStyle = theme.cardBorder;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // Inner Accent Top Strip
  ctx.fillStyle = theme.primary;
  drawRoundedRect(ctx, cardX, cardY, cardW, 8, [24, 24, 0, 0]);
  ctx.fill();

  // 4. Word & Tianzige Character Grid
  const chars = wordItem.word.split("");
  const charCount = chars.length;

  // Calculate box dimensions
  let boxSize = isPortrait ? Math.min(130, (cardW - 40) / charCount - 14) : Math.min(140, (cardW * 0.5) / charCount);
  if (charCount > 3) boxSize = isPortrait ? 90 : 100;
  const gap = 12;
  const totalGridW = charCount * boxSize + (charCount - 1) * gap;
  const startX = (W - totalGridW) / 2;
  const gridY = cardY + (isPortrait ? 60 : 35);

  chars.forEach((char, i) => {
    const bx = startX + i * (boxSize + gap);
    const by = gridY;

    if (showTianzige) {
      // Draw Tianzige Red Grid Box
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = theme.gridColor;
      ctx.strokeRect(bx, by, boxSize, boxSize);

      // Dotted internal lines (田字格)
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      // Horizontal mid line
      ctx.moveTo(bx, by + boxSize / 2);
      ctx.lineTo(bx + boxSize, by + boxSize / 2);
      // Vertical mid line
      ctx.moveTo(bx + boxSize / 2, by);
      ctx.lineTo(bx + boxSize / 2, by + boxSize);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    }

    // Draw Character
    ctx.font = `bold ${Math.floor(boxSize * 0.72)}px 'KaiTi', 'STKaiti', 'SimSun', 'PingFang SC', sans-serif`;
    ctx.fillStyle = theme.textDark;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, bx + boxSize / 2, by + boxSize / 2 + 2);
  });

  // 5. Guess Phase vs Reveal Phase Content
  let currentY = gridY + boxSize + 40;

  if (phase === "guess") {
    // GUESS / THINKING PHASE:
    // Display Animated Countdown Bar / Ring
    const timerW = Math.min(cardW - 80, 420);
    const timerH = 12;
    const timerX = (W - timerW) / 2;

    ctx.fillStyle = "rgba(100, 116, 139, 0.15)";
    drawRoundedRect(ctx, timerX, currentY, timerW, timerH, 6);
    ctx.fill();

    // Active countdown fill
    const activeW = Math.max(0, timerW * countdownProgress);
    const grad = ctx.createLinearGradient(timerX, 0, timerX + timerW, 0);
    grad.addColorStop(0, theme.accent);
    grad.addColorStop(1, theme.primary);
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, timerX, currentY, activeW, timerH, 6);
    ctx.fill();

    // Prompt Text
    ctx.font = "bold 24px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.fillStyle = theme.primary;
    ctx.textAlign = "center";
    ctx.fillText("🤔 考考你：这个词怎么读？是什么意思？", W / 2, currentY + 60);

    ctx.font = "18px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.fillStyle = theme.textMuted;
    ctx.fillText("仔细思考，答案即将揭晓...", W / 2, currentY + 100);

  } else {
    // REVEAL PHASE:
    // A. Pinyin with Tone
    ctx.font = `bold ${isPortrait ? 36 : 32}px 'Segoe UI', 'Arial', sans-serif`;
    ctx.fillStyle = theme.pinyinColor;
    ctx.textAlign = "center";
    ctx.fillText(wordItem.pinyin, W / 2, currentY);
    currentY += 45;

    // B. English Definition Pill / Box
    ctx.font = "italic 20px 'Segoe UI', 'Arial', sans-serif";
    ctx.fillStyle = theme.textDark;
    const engText = wordItem.english;
    const engMetrics = ctx.measureText(engText);
    const engW = Math.min(cardW - 60, engMetrics.width + 40);

    ctx.fillStyle = theme.badgeBg;
    drawRoundedRect(ctx, (W - engW) / 2, currentY - 14, engW, 36, 18);
    ctx.fill();

    ctx.fillStyle = theme.badgeText;
    ctx.fillText(engText, W / 2, currentY + 10);
    currentY += 55;

    // C. Collocations (搭配) - Vital for PSLE
    if (showCollocations && wordItem.collocations && wordItem.collocations.length > 0) {
      ctx.font = "bold 16px 'Segoe UI', 'PingFang SC', sans-serif";
      ctx.fillStyle = theme.textMuted;
      ctx.fillText("📝 核心词语搭配：", W / 2, currentY);
      currentY += 28;

      const colloText = wordItem.collocations.join("  |  ");
      ctx.font = "600 20px 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = theme.primary;
      ctx.fillText(colloText, W / 2, currentY);
      currentY += 45;
    }

    // D. Example Sentence Box (PSLE Context)
    if (showSentence && wordItem.sentence) {
      const sentBoxW = cardW - 50;
      const sentBoxH = isPortrait ? 130 : 100;
      const sentBoxX = (W - sentBoxW) / 2;

      ctx.fillStyle = "rgba(241, 245, 249, 0.65)";
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, sentBoxX, currentY, sentBoxW, sentBoxH, 16);
      ctx.fill();
      ctx.stroke();

      // Chinese Sentence
      ctx.font = "bold 18px 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = theme.textDark;
      ctx.textAlign = "center";
      wrapText(ctx, `“ ${wordItem.sentence} ”`, W / 2, currentY + 35, sentBoxW - 40, 26);

      // English Translation
      ctx.font = "14px 'Segoe UI', sans-serif";
      ctx.fillStyle = theme.textMuted;
      wrapText(ctx, wordItem.sentenceEn, W / 2, currentY + 85, sentBoxW - 40, 20);
    }
  }

  // 6. Bottom Progress & Branding Bar
  const bottomY = H - 55;

  // Index counter (e.g. 1 / 15)
  ctx.font = "bold 18px 'Segoe UI', 'PingFang SC', sans-serif";
  ctx.fillStyle = theme.textMuted;
  ctx.textAlign = "left";
  ctx.fillText(`词语 ${cardIndex} / ${totalCards}`, 40, bottomY);

  // Tag Badge (识写字 / 必考成语)
  ctx.textAlign = "right";
  ctx.font = "bold 16px 'Segoe UI', 'PingFang SC', sans-serif";
  ctx.fillStyle = theme.accent;
  ctx.fillText(`★ ${wordItem.tag || "PSLE 核心必考"}`, W - 40, bottomY);

  // Overall progress bar line at bottom
  const overallPct = cardIndex / totalCards;
  ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
  ctx.fillRect(0, H - 8, W, 8);

  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, H - 8, W * overallPct, 8);
}

/** Helper to draw rounded rectangle */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else if (Array.isArray(radius)) {
    radius = { tl: radius[0], tr: radius[1], br: radius[2], bl: radius[3] };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

/** Helper for multiline text wrapping */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = text.split("");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
