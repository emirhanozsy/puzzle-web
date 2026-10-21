import { PieceEdges, PuzzlePiece, PuzzleConfig } from '../types/puzzle';

// Robust image loader with CORS handling and procedural artistic fallback
export function loadPuzzleImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Image failed to load via CORS or URL, generating artistic canvas fallback:', src);
      // Generate a vibrant procedural landscape canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Sunset gradient
        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#f43f6e'); // Watermelon
        grad.addColorStop(0.35, '#fb923c'); // Amber
        grad.addColorStop(0.7, '#38bdf8'); // Sky
        grad.addColorStop(1, '#10b981'); // Mint
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 800);

        // Sun
        ctx.beginPath();
        ctx.arc(600, 350, 120, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 40;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Mountain silhouettes
        ctx.beginPath();
        ctx.moveTo(0, 800);
        ctx.lineTo(250, 480);
        ctx.lineTo(500, 600);
        ctx.lineTo(800, 420);
        ctx.lineTo(1200, 650);
        ctx.lineTo(1200, 800);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fill();

        // Water reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let y = 600; y < 800; y += 15) {
          ctx.fillRect(400 + Math.sin(y) * 40, y, 400 + Math.cos(y) * 80, 4);
        }
      }
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.src = canvas.toDataURL('image/jpeg', 0.9);
    };
    img.src = src;
  });
}


// Generates the tab/blank edge map for all pieces in a grid
export function generateEdgeMatrix(rows: number, cols: number): PieceEdges[][] {
  const edges: PieceEdges[][] = [];

  for (let r = 0; r < rows; r++) {
    edges[r] = [];
    for (let c = 0; c < cols; c++) {
      const top = r === 0 ? 0 : -edges[r - 1][c].bottom;
      const left = c === 0 ? 0 : -edges[r][c - 1].right;
      const bottom = r === rows - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1);
      const right = c === cols - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1);

      edges[r][c] = { top, right, bottom, left };
    }
  }

  return edges;
}

// Draws a realistic jigsaw edge connecting (x1, y1) to (x2, y2)
// edgeValue: 0 (flat), 1 (tab outward), -1 (blank inward)
export function drawJigsawEdge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edgeValue: number
) {
  if (edgeValue === 0) {
    ctx.lineTo(x2, y2);
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);

  // Unit vector along edge
  const ux = dx / length;
  const uy = dy / length;

  // Normal vector pointing outward (right-hand rule: perpendicular)
  // For clockwise path: outward normal is (-uy, ux)
  const sign = edgeValue; // +1 = outward, -1 = inward
  const nx = -uy * sign;
  const ny = ux * sign;

  // Proportions of classical jigsaw tab
  const tabHeight = length * 0.22;
  const p1 = 0.36; // start of tab neck
  const p2 = 0.44; // neck base
  const p3 = 0.50; // center of tab head
  const p4 = 0.56; // neck return
  const p5 = 0.64; // end of tab neck

  // Helper point calculation along edge & normal
  const pt = (t: number, n: number): [number, number] => {
    return [
      x1 + ux * (length * t) + nx * (tabHeight * n),
      y1 + uy * (length * t) + ny * (tabHeight * n),
    ];
  };

  // Straight to start of neck
  const [nx1, ny1] = pt(p1, 0);
  ctx.lineTo(nx1, ny1);

  // Neck taper inwards slightly before bulging
  const [c1x, c1y] = pt(p1 + 0.03, -0.05);
  const [c2x, c2y] = pt(p2 - 0.02, 0.4);
  const [p2x, p2y] = pt(p2, 0.7);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2x, p2y);

  // Bulbous head
  const [c3x, c3y] = pt(p2 + 0.03, 1.15);
  const [c4x, c4y] = pt(p4 - 0.03, 1.15);
  const [p4x, p4y] = pt(p4, 0.7);
  ctx.bezierCurveTo(c3x, c3y, c4x, c4y, p4x, p4y);

  // Return to base line
  const [c5x, c5y] = pt(p4 + 0.02, 0.4);
  const [c6x, c6y] = pt(p5 - 0.03, -0.05);
  const [p5x, p5y] = pt(p5, 0);
  ctx.bezierCurveTo(c5x, c5y, c6x, c6y, p5x, p5y);

  // Line to end of edge
  ctx.lineTo(x2, y2);
}

// Builds the full closed path for a single piece with its 4 edges
export function buildPiecePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  edges: PieceEdges
) {
  ctx.beginPath();
  ctx.moveTo(x, y);

  // Top edge (left to right)
  drawJigsawEdge(ctx, x, y, x + w, y, edges.top);

  // Right edge (top to bottom)
  drawJigsawEdge(ctx, x + w, y, x + w, y + h, edges.right);

  // Bottom edge (right to left)
  drawJigsawEdge(ctx, x + w, y + h, x, y + h, edges.bottom);

  // Left edge (bottom to top)
  drawJigsawEdge(ctx, x, y + h, x, y, edges.left);

  ctx.closePath();
}

// Slice source image into individual piece bitmaps
export async function createPuzzlePieces(
  image: HTMLImageElement,
  config: PuzzleConfig,
  boardWidth: number,
  boardHeight: number,
  containerWidth: number,
  containerHeight: number
): Promise<PuzzlePiece[]> {
  const { rows, cols } = config;
  const pieceWidth = boardWidth / cols;
  const pieceHeight = boardHeight / rows;
  const edgeMatrix = generateEdgeMatrix(rows, cols);

  const tabSize = Math.max(pieceWidth, pieceHeight) * 0.25;
  const pieces: PuzzlePiece[] = [];

  // Scattering zones: pieces are placed around the board so the center is clear
  // Left tray, right tray, bottom tray
  const margin = 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      const targetX = c * pieceWidth;
      const targetY = r * pieceHeight;
      const edges = edgeMatrix[r][c];

      // Piece canvas with tab padding
      const canvas = document.createElement('canvas');
      const cw = Math.ceil(pieceWidth + tabSize * 2);
      const ch = Math.ceil(pieceHeight + tabSize * 2);
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.save();
        // Shift origin by tabSize
        ctx.translate(tabSize, tabSize);

        // Clip piece path
        buildPiecePath(ctx, 0, 0, pieceWidth, pieceHeight, edges);
        ctx.clip();

        // Draw portion of image
        // Scale factor between image natural size and board size
        const scaleX = image.naturalWidth / boardWidth;
        const scaleY = image.naturalHeight / boardHeight;

        const srcX = (targetX - tabSize) * scaleX;
        const srcY = (targetY - tabSize) * scaleY;
        const srcW = cw * scaleX;
        const srcH = ch * scaleY;

        ctx.drawImage(
          image,
          srcX,
          srcY,
          srcW,
          srcH,
          -tabSize,
          -tabSize,
          cw,
          ch
        );

        // 3D tactile bevel highlight
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        buildPiecePath(ctx, 0, 0, pieceWidth, pieceHeight, edges);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        buildPiecePath(ctx, 0, 0, pieceWidth, pieceHeight, edges);
        ctx.stroke();

        ctx.restore();
      }

      // Initial scatter placement:
      // Half on left side, half on right side (or below on smaller screens)
      let initialX: number;
      let initialY: number;

      const side = Math.random() > 0.5 ? 'left' : 'right';
      const boardLeft = (containerWidth - boardWidth) / 2;
      const boardTop = (containerHeight - boardHeight) / 2;

      if (side === 'left' && boardLeft > pieceWidth + 30) {
        initialX = margin + Math.random() * Math.max(10, boardLeft - pieceWidth - margin * 2);
        initialY = margin + Math.random() * Math.max(10, containerHeight - pieceHeight - margin * 2);
      } else if (side === 'right' && (containerWidth - (boardLeft + boardWidth)) > pieceWidth + 30) {
        const rightStart = boardLeft + boardWidth + margin;
        const availableWidth = containerWidth - rightStart - margin - pieceWidth;
        initialX = rightStart + Math.random() * Math.max(10, availableWidth);
        initialY = margin + Math.random() * Math.max(10, containerHeight - pieceHeight - margin * 2);
      } else {
        // Fallback scatter around periphery
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.min(containerWidth, containerHeight) * 0.42;
        initialX = containerWidth / 2 + Math.cos(angle) * radius - pieceWidth / 2;
        initialY = containerHeight / 2 + Math.sin(angle) * radius - pieceHeight / 2;
      }

      // Keep within bounds
      initialX = Math.max(10, Math.min(containerWidth - pieceWidth - 10, initialX));
      initialY = Math.max(10, Math.min(containerHeight - pieceHeight - 10, initialY));

      pieces.push({
        id,
        row: r,
        col: c,
        currentX: Math.round(initialX),
        currentY: Math.round(initialY),
        targetX: Math.round(targetX),
        targetY: Math.round(targetY),
        width: Math.round(pieceWidth),
        height: Math.round(pieceHeight),
        isLocked: false,
        edges,
        dataUrl: canvas.toDataURL('image/png'),
        zIndex: 1,
      });
    }
  }

  return pieces;
}

// Calculate board dimensions fitting comfortably within screen
export function calculateBoardDimensions(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspect = imageWidth / imageHeight;
  let width = maxWidth;
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

// Automatically calculate the optimal rows and cols for any arbitrary target piece count
export function calculateGridFromPieceCount(
  targetCount: number,
  aspect: number = 4 / 3
): { rows: number; cols: number; totalPieces: number } {
  const clamped = Math.max(4, Math.min(300, Math.round(targetCount)));
  let bestRows = 2;
  let bestCols = 2;
  let minDiff = Infinity;
  let bestRatioDiff = Infinity;

  // Search for rows and cols closest to targetCount while keeping piece aspect ratio close to 1:1
  for (let r = 2; r <= Math.min(30, clamped); r++) {
    const c = Math.max(2, Math.round(clamped / r));
    const total = r * c;
    const countDiff = Math.abs(total - clamped);
    const ratioDiff = Math.abs(c / r - aspect);

    if (countDiff < minDiff || (countDiff === minDiff && ratioDiff < bestRatioDiff)) {
      minDiff = countDiff;
      bestRatioDiff = ratioDiff;
      bestRows = r;
      bestCols = c;
    }
  }

  return {
    rows: bestRows,
    cols: bestCols,
    totalPieces: bestRows * bestCols,
  };
}

