import React from "react";

// Yo'l belgisi ikonkasi — shakl (uchburchak/doira/kvadrat/olmos) + soddalashtirilgan piktogramma
// size: piksel o'lchami (kvadrat konteyner)
export default function SignIcon({ shape, pic, size = 64 }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {renderShape(shape, s)}
      <g style={shape === "redCircle" ? { filter: "none" } : undefined}>
        {renderPictogram(pic, s, shape)}
      </g>
    </svg>
  );
}

function renderShape(shape, s) {
  const pad = s * 0.04;
  switch (shape) {
    case "triangle":
      return (
        <polygon
          points={`${s / 2},${pad} ${s - pad},${s - pad} ${pad},${s - pad}`}
          fill="#FFDE33"
          stroke="#E4231C"
          strokeWidth={s * 0.06}
          strokeLinejoin="round"
        />
      );
    case "invertedTriangle":
      return (
        <polygon
          points={`${pad},${pad} ${s - pad},${pad} ${s / 2},${s - pad}`}
          fill="#FFFFFF"
          stroke="#E4231C"
          strokeWidth={s * 0.08}
          strokeLinejoin="round"
        />
      );
    case "circle":
      return (
        <circle
          cx={s / 2}
          cy={s / 2}
          r={s / 2 - pad}
          fill="#2465B0"
          stroke="#FFFFFF"
          strokeWidth={s * 0.01}
        />
      );
    case "redCircle":
      return (
        <circle
          cx={s / 2}
          cy={s / 2}
          r={s / 2 - pad}
          fill="#FFFFFF"
          stroke="#E4231C"
          strokeWidth={s * 0.12}
        />
      );
    case "diamond":
      return (
        <rect
          x={s * 0.14}
          y={s * 0.14}
          width={s * 0.72}
          height={s * 0.72}
          fill="#FFDE33"
          stroke="#FFFFFF"
          strokeWidth={s * 0.02}
          transform={`rotate(45 ${s / 2} ${s / 2})`}
        />
      );
    case "octagon": {
      const o = s * 0.29;
      const p2 = s * 0.04;
      return (
        <polygon
          points={`${o},${p2} ${s - o},${p2} ${s - p2},${o} ${s - p2},${s - o} ${s - o},${s - p2} ${o},${s - p2} ${p2},${s - o} ${p2},${o}`}
          fill="#E4231C"
        />
      );
    }
    case "square":
      return (
        <rect
          x={pad}
          y={pad}
          width={s - pad * 2}
          height={s - pad * 2}
          rx={s * 0.08}
          fill="#2465B0"
        />
      );
    case "rect":
      return (
        <rect
          x={pad}
          y={s * 0.28}
          width={s - pad * 2}
          height={s * 0.44}
          rx={s * 0.05}
          fill="#FFFFFF"
          stroke="#1F2937"
          strokeWidth={s * 0.025}
        />
      );
    default:
      return (
        <circle cx={s / 2} cy={s / 2} r={s / 2 - pad} fill="#E5E7EB" />
      );
  }
}

// Rangga qarab piktogramma stroke rangi (doira/kvadrat -> oq, uchburchak/oq fon -> qora)
function strokeFor(shape) {
  if (shape === "circle" || shape === "square") return "#FFFFFF";
  if (shape === "octagon") return "#FFFFFF";
  return "#1F2937";
}

function renderPictogram(pic, s, shape) {
  // markazlashtirilgan, kichraytirilgan piktogramma guruhi
  const scale = s / 64;
  // redCircle (taqiqlovchi) belgilarda piktogramma odatda qora bo'ladi (oq fon ustida),
  // shu sababli "#FFFFFF" bilan chizilgan qismlarni qora rangga almashtiramiz.
  const isRedCircle = shape === "redCircle";
  const wrap = (children) => (
    <g
      transform={`translate(${s / 2}, ${s / 2}) scale(${scale})`}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={isRedCircle ? { color: "#1F2937" } : undefined}
      className={isRedCircle ? "sign-pic-dark" : undefined}
    >
      {children}
    </g>
  );

  const arrow = (rot = 0, color = "#FFF") => (
    <g transform={`rotate(${rot})`}>
      <line x1="0" y1="10" x2="0" y2="-10" stroke={color} strokeWidth="4" />
      <polygon points="0,-15 -6,-5 6,-5" fill={color} />
    </g>
  );

  switch (pic) {
    // ---- Ogohlantiruvchi ----
    case "railTrain":
      return wrap(
        <g fill="#1F2937">
          <circle cx="0" cy="2" r="9" fill="none" stroke="#1F2937" strokeWidth="3" />
          <rect x="-4" y="-3" width="8" height="6" />
        </g>
      );
    case "railGated":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3" fill="none">
          <line x1="-12" y1="-8" x2="12" y2="8" />
          <line x1="-12" y1="8" x2="12" y2="-8" />
          <line x1="-12" y1="10" x2="12" y2="10" strokeDasharray="3 3" />
        </g>
      );
    case "railPlain":
      return wrap(
        <g stroke="#1F2937" strokeWidth="4">
          <line x1="-14" y1="8" x2="14" y2="8" />
        </g>
      );
    case "crossX":
    case "crossXX":
      return wrap(
        <g stroke="#1F2937" strokeWidth="4">
          <line x1="-13" y1="-13" x2="13" y2="13" />
          <line x1="-13" y1="13" x2="13" y2="-13" />
        </g>
      );
    case "railStripe1":
      return wrap(
        <line x1="-4" y1="-16" x2="4" y2="16" stroke="#E4231C" strokeWidth="5" />
      );
    case "railStripe2":
      return wrap(
        <g stroke="#E4231C" strokeWidth="4">
          <line x1="-9" y1="-16" x2="-1" y2="16" />
          <line x1="3" y1="-16" x2="11" y2="16" />
        </g>
      );
    case "railStripe3":
      return wrap(
        <g stroke="#E4231C" strokeWidth="3.5">
          <line x1="-13" y1="-16" x2="-6" y2="16" />
          <line x1="-2" y1="-16" x2="5" y2="16" />
          <line x1="8" y1="-16" x2="15" y2="16" />
        </g>
      );
    case "tram":
      return wrap(
        <g fill="#1F2937">
          <rect x="-10" y="-8" width="20" height="12" rx="2" />
          <circle cx="-5" cy="7" r="2.5" />
          <circle cx="5" cy="7" r="2.5" />
          <line x1="0" y1="-8" x2="0" y2="-16" stroke="#1F2937" strokeWidth="2" />
        </g>
      );
    case "crossRoads":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3.5">
          <line x1="0" y1="-16" x2="0" y2="16" />
          <line x1="-14" y1="6" x2="14" y2="6" />
        </g>
      );
    case "roundabout":
      return wrap(
        <g fill="none" stroke="#1F2937" strokeWidth="3">
          <circle cx="0" cy="0" r="10" />
          <polygon points="8,-10 14,-10 11,-4" fill="#1F2937" stroke="none" />
        </g>
      );
    case "trafficLight":
      return wrap(
        <g>
          <rect x="-5" y="-14" width="10" height="20" rx="2" fill="none" stroke="#1F2937" strokeWidth="2.5" />
          <circle cx="0" cy="-9" r="2.3" fill="#E4231C" />
          <circle cx="0" cy="-2" r="2.3" fill="#F59E0B" />
          <circle cx="0" cy="5" r="2.3" fill="#10B981" />
        </g>
      );
    case "drawbridge":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3" fill="none">
          <path d="M-14,10 L-2,10 L6,-6" />
          <path d="M14,10 L14,10" />
          <path d="M-14,10 L14,10" />
          <path d="M6,-6 L10,-2" />
        </g>
      );
    case "riverbank":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2.5" fill="none">
          <path d="M-14,4 Q-7,-2 0,4 T14,4" />
          <path d="M-8,10 L2,-6 L10,6" strokeWidth="2.2" />
        </g>
      );
    case "curveRight":
      return wrap(
        <path d="M-10,14 Q-10,-14 14,-14" stroke="#1F2937" strokeWidth="4" fill="none" />
      );
    case "curveLeft":
      return wrap(
        <path d="M10,14 Q10,-14 -14,-14" stroke="#1F2937" strokeWidth="4" fill="none" />
      );
    case "doubleCurveRight":
      return wrap(
        <path d="M-12,14 Q-12,0 0,0 Q12,0 12,-14" stroke="#1F2937" strokeWidth="4" fill="none" />
      );
    case "doubleCurveLeft":
      return wrap(
        <path d="M12,14 Q12,0 0,0 Q-12,0 -12,-14" stroke="#1F2937" strokeWidth="4" fill="none" />
      );
    case "descent":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3" fill="none">
          <path d="M-14,-10 L14,10" />
          <text x="-4" y="-2" fontSize="9" fill="#1F2937" stroke="none" fontWeight="bold">%</text>
        </g>
      );
    case "ascent":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3" fill="none">
          <path d="M-14,10 L14,-10" />
          <text x="-4" y="6" fontSize="9" fill="#1F2937" stroke="none" fontWeight="bold">%</text>
        </g>
      );
    case "slippery":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2.5" fill="none">
          <path d="M-12,4 Q-4,-4 4,4 T14,0" />
          <path d="M-6,10 L14,-6" strokeDasharray="2 2" />
        </g>
      );
    case "bump":
      return wrap(
        <path d="M-14,6 Q-7,-8 0,6 Q7,-8 14,6" stroke="#1F2937" strokeWidth="3.5" fill="none" />
      );
    case "gravel":
      return wrap(
        <g fill="#1F2937">
          <rect x="-14" y="2" width="14" height="8" rx="2" />
          <circle cx="6" cy="-4" r="1.6" />
          <circle cx="11" cy="0" r="1.6" />
          <circle cx="10" cy="8" r="1.6" />
        </g>
      );
    case "narrowBoth":
      return wrap(
        <g stroke="#1F2937" strokeWidth="4" fill="none">
          <path d="M-10,-14 L-3,4 L-3,14" />
          <path d="M10,-14 L3,4 L3,14" />
        </g>
      );
    case "narrowRight":
      return wrap(
        <g stroke="#1F2937" strokeWidth="4" fill="none">
          <path d="M-8,-14 L-8,14" />
          <path d="M9,-14 L2,4 L2,14" />
        </g>
      );
    case "narrowLeft":
      return wrap(
        <g stroke="#1F2937" strokeWidth="4" fill="none">
          <path d="M-9,-14 L-2,4 L-2,14" />
          <path d="M8,-14 L8,14" />
        </g>
      );
    case "twoWay":
      return wrap(
        <g fill="#1F2937">
          <polygon points="-4,-14 -8,-6 0,-6" />
          <line x1="-4" y1="-6" x2="-4" y2="6" stroke="#1F2937" strokeWidth="3" />
          <polygon points="4,14 0,6 8,6" />
          <line x1="4" y1="6" x2="4" y2="-6" stroke="#1F2937" strokeWidth="3" />
        </g>
      );
    case "pedestrianCross":
      return wrap(personIcon());
    case "children":
      return wrap(
        <g fill="#1F2937">
          <circle cx="-6" cy="-10" r="3" />
          <path d="M-6,-6 L-6,4 M-9,-1 L-3,-1 M-6,4 L-9,10 M-6,4 L-3,10" stroke="#1F2937" strokeWidth="2" />
          <circle cx="6" cy="-6" r="3" />
          <path d="M6,-2 L6,8 M3,2 L9,2 M6,8 L3,14 M6,8 L9,14" stroke="#1F2937" strokeWidth="2" />
        </g>
      );
    case "bicycle":
      return wrap(bikeIcon());
    case "roadwork":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2.5" fill="#1F2937">
          <circle cx="-7" cy="-10" r="2.5" />
          <path d="M-7,-7 L-7,2 L-12,10 M-7,2 L-2,10 M-7,-4 L2,-8 L6,-2" fill="none" />
          <rect x="4" y="8" width="6" height="4" />
        </g>
      );
    case "cattle":
      return wrap(
        <g fill="#1F2937">
          <ellipse cx="0" cy="4" rx="12" ry="6" />
          <circle cx="10" cy="-2" r="4" />
          <rect x="-10" y="8" width="2.5" height="6" />
          <rect x="6" y="8" width="2.5" height="6" />
        </g>
      );
    case "deer":
      return wrap(
        <g fill="#1F2937">
          <path d="M-6,-10 L-8,-16 M-6,-10 L-4,-16 M6,-8 L8,-14 M6,-8 L4,-14" stroke="#1F2937" strokeWidth="1.5" fill="none" />
          <ellipse cx="0" cy="2" rx="12" ry="6" />
          <circle cx="9" cy="-6" r="4" />
          <rect x="-9" y="6" width="2.2" height="8" />
          <rect x="6" y="6" width="2.2" height="8" />
        </g>
      );
    case "rockfall":
      return wrap(
        <g fill="#1F2937">
          <polygon points="-10,10 -12,-2 -2,-10 4,-4 2,10" />
          <circle cx="10" cy="4" r="4" />
        </g>
      );
    case "wind":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3" fill="none">
          <path d="M-14,-4 Q0,-14 12,-4" />
          <path d="M-14,4 L10,4" />
          <path d="M-14,10 L4,10" />
        </g>
      );
    case "airplane":
      return wrap(
        <g fill="#1F2937">
          <path d="M-14,2 L14,-4 L14,0 L2,4 L2,10 L6,12 L6,14 L-2,12 L-8,14 L-8,12 L-4,10 L-4,4 L-14,6 Z" />
        </g>
      );
    case "tunnel":
      return wrap(
        <path d="M-12,10 L-12,-2 A12,12 0 0 1 12,-2 L12,10" stroke="#1F2937" strokeWidth="4" fill="none" />
      );
    case "exclaim":
      return wrap(
        <g fill="#1F2937">
          <rect x="-2.2" y="-14" width="4.4" height="16" rx="2" />
          <circle cx="0" cy="10" r="2.6" />
        </g>
      );
    case "speedBump":
      return wrap(
        <path d="M-14,8 L-6,8 L-2,-8 L2,-8 L6,8 L14,8" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinejoin="round" />
      );
    case "chevronRight":
      return wrap(
        <g fill="#E4231C">
          <polygon points="-14,-6 -4,-6 0,0 -4,6 -14,6 -10,0" />
          <polygon points="2,-6 12,-6 16,0 12,6 2,6 6,0" />
        </g>
      );
    case "chevronLeft":
      return wrap(
        <g fill="#E4231C">
          <polygon points="14,-6 4,-6 0,0 4,6 14,6 10,0" />
          <polygon points="-2,-6 -12,-6 -16,0 -12,6 -2,6 -6,0" />
        </g>
      );
    case "chevronBoth":
      return wrap(
        <g fill="#E4231C">
          <polygon points="-16,-6 -6,-6 -2,0 -6,6 -16,6 -12,0" />
          <polygon points="16,-6 6,-6 2,0 6,6 16,6 12,0" />
        </g>
      );
    case "traffic":
      return wrap(
        <g fill="#1F2937">
          <rect x="-14" y="-4" width="9" height="6" rx="1" />
          <rect x="-3" y="-6" width="9" height="8" rx="1" />
          <rect x="8" y="-3" width="8" height="5" rx="1" />
        </g>
      );

    // ---- Priority ----
    case "solidYellow":
      return null; // shape itself is the pictogram (diamond yellow)
    case "diamondStrike":
      return wrap(
        <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="4" />
      );
    case "tJoinRight":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3.5">
          <line x1="0" y1="-16" x2="0" y2="16" />
          <line x1="0" y1="6" x2="14" y2="6" />
        </g>
      );
    case "tJoinLeft":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3.5">
          <line x1="0" y1="-16" x2="0" y2="16" />
          <line x1="0" y1="6" x2="-14" y2="6" />
        </g>
      );
    case "blank":
      return null;
    case "stopText":
      return wrap(
        <text x="0" y="5" fontSize="11" fill="#FFFFFF" stroke="none" fontWeight="800" textAnchor="middle" fontFamily="Arial, sans-serif">
          STOP
        </text>
      );
    case "priorityOver":
      return wrap(
        <g>
          <rect x="-3.5" y="-14" width="7" height="16" fill="#E4231C" />
          <polygon points="0,4 -8,14 8,14" fill="#FFFFFF" />
        </g>
      );
    case "priorityGive":
      return wrap(
        <g>
          <rect x="-3.5" y="-14" width="7" height="16" fill="#FFFFFF" />
          <polygon points="0,4 -8,14 8,14" fill="#E4231C" />
        </g>
      );

    // ---- Prohibition ----
    case "noEntry":
      // 3.1 — butun doira qizil, o'rtasida oq chiziq (maxsus holat: shape ustidan qizil doira chizamiz)
      return (
        <g transform={`translate(${s / 2}, ${s / 2}) scale(${scale})`}>
          <circle cx="0" cy="0" r="30" fill="#E4231C" />
          <rect x="-19" y="-5.5" width="38" height="11" rx="1" fill="#FFFFFF" />
        </g>
      );
    case "noVehicles":
      return null; // faqat qizil aylana
    case "noCar":
      return wrap(carIcon("#FFFFFF"));
    case "noTruck":
      return wrap(truckIcon("#FFFFFF"));
    case "noMoto":
      return wrap(motoIcon("#FFFFFF"));
    case "noTractor":
      return wrap(tractorIcon("#FFFFFF"));
    case "noTrailer":
      return wrap(truckIcon("#FFFFFF"));
    case "noCart":
      return wrap(
        <g fill="#FFFFFF">
          <circle cx="6" cy="8" r="4" />
          <path d="M-14,8 L-2,8 L2,-6 L8,-6" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        </g>
      );
    case "noBike":
      return wrap(bikeIcon("#FFFFFF"));
    case "noPedestrian":
      return wrap(personIcon("#FFFFFF"));
    case "weightLimit":
      return wrap(
        <text x="0" y="6" fontSize="13" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">7т</text>
      );
    case "axleLimit":
      return wrap(
        <g fill="#FFFFFF" stroke="none" fontFamily="Arial, sans-serif">
          <text x="0" y="0" fontSize="10" fontWeight="800" textAnchor="middle">5тс</text>
          <line x1="-10" y1="8" x2="10" y2="8" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="-6" cy="8" r="2" />
          <circle cx="6" cy="8" r="2" />
        </g>
      );
    case "heightLimit":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2.5" fill="none">
          <path d="M-12,-10 L12,-10 M-12,10 L12,10" markerEnd="url(#arrow)" />
          <line x1="0" y1="-10" x2="0" y2="10" strokeDasharray="3 2" />
          <text x="0" y="4" fontSize="8" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">3.5</text>
        </g>
      );
    case "widthLimit":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2.5" fill="none">
          <line x1="-12" y1="0" x2="12" y2="0" />
          <text x="0" y="12" fontSize="8" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">2.7</text>
        </g>
      );
    case "lengthLimit":
      return wrap(
        <g fill="#FFFFFF" stroke="none" fontFamily="Arial, sans-serif">
          {truckIcon("#FFFFFF")}
        </g>
      );
    case "minGap":
      return wrap(
        <g fill="#FFFFFF" stroke="none" fontFamily="Arial, sans-serif" fontWeight="800">
          {carIcon("#FFFFFF")}
        </g>
      );
    case "customs":
      return wrap(
        <text x="0" y="4" fontSize="7" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">CLO</text>
      );
    case "dangerText":
      return wrap(
        <text x="0" y="4" fontSize="6" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">XATAR</text>
      );
    case "noRightTurn":
      return wrap(<g transform="rotate(0)">{arrow(90, "#FFFFFF")}</g>);
    case "noLeftTurn":
      return wrap(<g>{arrow(-90, "#FFFFFF")}</g>);
    case "noUTurn":
      return wrap(
        <path d="M8,10 L8,-4 A8,8 0 0 0 -8,-4 L-8,4" stroke="#FFFFFF" strokeWidth="3" fill="none" markerEnd="url(#a)" />
      );
    case "noOvertake":
      return wrap(
        <g fill="#FFFFFF">
          {carIcon("#FFFFFF", -6)}
          <g transform="translate(7,0)">{carIconOutline()}</g>
        </g>
      );
    case "endNoOvertake":
      return wrap(
        <g fill="#1F2937" stroke="#1F2937">
          {carIcon("#1F2937", -6)}
        </g>
      );
    case "noOvertakeTruck":
      return wrap(truckIcon("#FFFFFF"));
    case "endNoOvertakeTruck":
      return wrap(truckIcon("#1F2937"));
    case "speedLimit":
      return wrap(
        <text x="0" y="6" fontSize="16" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
      );
    case "endSpeedLimit":
      return wrap(
        <text x="0" y="6" fontSize="16" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
      );
    case "noHorn":
      return wrap(
        <g fill="#FFFFFF">
          <path d="M-10,-2 L-2,-2 L6,-8 L6,8 L-2,2 L-10,2 Z" />
        </g>
      );
    case "noStopping":
      return wrap(
        <g stroke="#E4231C" strokeWidth="3">
          <line x1="-13" y1="-13" x2="13" y2="13" />
          <line x1="-13" y1="13" x2="13" y2="-13" />
        </g>
      );
    case "noParking":
      return wrap(<line x1="-13" y1="-13" x2="13" y2="13" stroke="#E4231C" strokeWidth="3" />);
    case "noParkingOdd":
      return wrap(
        <line x1="0" y1="-14" x2="0" y2="14" stroke="#FFFFFF" strokeWidth="3" />
      );
    case "noParkingEven":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="3">
          <line x1="-4" y1="-14" x2="-4" y2="14" />
          <line x1="4" y1="-14" x2="4" y2="14" />
        </g>
      );
    case "endAllLimits":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2">
          <line x1="-13" y1="-13" x2="13" y2="13" />
          <line x1="-13" y1="-2" x2="6" y2="13" />
          <line x1="-2" y1="-13" x2="13" y2="2" />
        </g>
      );
    case "noHazmat":
      return wrap(
        <g fill="none" stroke="#FFFFFF" strokeWidth="2">
          <path d="M-12,10 L-12,-2 L-6,-10 L6,-10 L12,-2 L12,10" />
        </g>
      );
    case "noExplosive":
      return wrap(
        <g fill="#FFFFFF">
          <polygon points="0,-12 3,-2 12,-2 5,4 8,12 0,6 -8,12 -5,4 -12,-2 -3,-2" />
        </g>
      );

    // ---- Mandatory ----
    case "arrowUp":
      return wrap(arrow(0, "#FFFFFF"));
    case "arrowRight":
      return wrap(arrow(90, "#FFFFFF"));
    case "arrowLeft":
      return wrap(arrow(-90, "#FFFFFF"));
    case "arrowUpRight":
      return wrap(
        <g>
          {arrow(0, "#FFFFFF")}
          {arrow(90, "#FFFFFF")}
        </g>
      );
    case "arrowUpLeft":
      return wrap(
        <g>
          {arrow(0, "#FFFFFF")}
          {arrow(-90, "#FFFFFF")}
        </g>
      );
    case "arrowLeftRight":
      return wrap(
        <g>
          {arrow(-90, "#FFFFFF")}
          {arrow(90, "#FFFFFF")}
        </g>
      );
    case "passRight":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="3" fill="none">
          <path d="M-8,-14 L8,10" markerEnd="url(#a)" />
        </g>
      );
    case "passLeft":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="3" fill="none">
          <path d="M8,-14 L-8,10" />
        </g>
      );
    case "passBoth":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="3" fill="none">
          <path d="M-8,-14 L0,4" />
          <path d="M8,-14 L0,4" />
          <line x1="0" y1="4" x2="0" y2="14" />
        </g>
      );
    case "roundaboutMand":
      return wrap(
        <g fill="none" stroke="#FFFFFF" strokeWidth="3">
          <circle cx="0" cy="0" r="10" />
          <polygon points="8,-10 14,-10 11,-4" fill="#FFFFFF" stroke="none" />
        </g>
      );
    case "carOnly":
      return wrap(carIcon("#FFFFFF"));
    case "bikeLane":
      return wrap(bikeIcon("#FFFFFF"));
    case "pedestrianLane":
      return wrap(personIcon("#FFFFFF"));
    case "sharedLane":
    case "sharedLaneEnd":
    case "separatedLane":
    case "separatedLane2":
    case "separatedLaneEnd1":
    case "separatedLaneEnd2":
      return wrap(
        <g>
          <g transform="translate(-8,0) scale(0.7)">{personIcon("#FFFFFF")}</g>
          <g transform="translate(8,0) scale(0.7)">{bikeIcon("#FFFFFF")}</g>
        </g>
      );
    case "minSpeed":
      return wrap(
        <text x="0" y="6" fontSize="16" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
      );
    case "minSpeedEnd":
      return wrap(
        <g>
          <text x="0" y="6" fontSize="16" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );
    case "hazmatDirLeft":
      return wrap(
        <g>
          <rect x="-7" y="-14" width="14" height="10" fill="#F59E0B" stroke="#1F2937" strokeWidth="1" />
          <line x1="-12" y1="-4" x2="12" y2="-4" stroke="#1F2937" strokeWidth="2" />
          <circle cx="0" cy="8" r="7" fill="#2465B0" />
          {arrow(-90, "#FFFFFF")}
        </g>
      );
    case "hazmatDirUp":
      return wrap(
        <g>
          <rect x="-7" y="-14" width="14" height="10" fill="#F59E0B" stroke="#1F2937" strokeWidth="1" />
          <line x1="-12" y1="-4" x2="12" y2="-4" stroke="#1F2937" strokeWidth="2" />
          <circle cx="0" cy="8" r="7" fill="#2465B0" />
          {arrow(0, "#FFFFFF")}
        </g>
      );
    case "hazmatDirRight":
      return wrap(
        <g>
          <rect x="-7" y="-14" width="14" height="10" fill="#F59E0B" stroke="#1F2937" strokeWidth="1" />
          <line x1="-12" y1="-4" x2="12" y2="-4" stroke="#1F2937" strokeWidth="2" />
          <circle cx="0" cy="8" r="7" fill="#2465B0" />
          {arrow(90, "#FFFFFF")}
        </g>
      );
    case "horseRiding":
      return wrap(
        <g fill="#FFFFFF">
          <circle cx="4" cy="-6" r="3" />
          <path d="M4,-3 L4,4 L10,8 M4,0 L-4,2 L-10,-2 M-4,2 L-4,10 M4,4 L4,10" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        </g>
      );

    // ---- Information (mostly white symbols on blue square/rect) ----
    case "motorway":
      return wrap(
        <g fill="#FFFFFF">
          <path d="M-4,14 L-8,-14 L-1,-14 L-1,14 Z" />
          <path d="M4,14 L8,-14 L1,-14 L1,14 Z" />
        </g>
      );
    case "motorwayEnd":
      return wrap(
        <g>
          <g fill="#FFFFFF">
            <path d="M-4,14 L-8,-14 L-1,-14 L-1,14 Z" />
            <path d="M4,14 L8,-14 L1,-14 L1,14 Z" />
          </g>
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );
    case "expressRoad":
      return wrap(carIcon("#FFFFFF"));
    case "expressRoadEnd":
      return wrap(
        <g>
          {carIcon("#FFFFFF")}
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );
    case "oneWay":
      return wrap(arrow(0, "#FFFFFF"));
    case "oneWayEnd":
      return wrap(
        <g>
          {arrow(0, "#FFFFFF")}
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );
    case "oneWayExitLeft":
      return wrap(arrow(-90, "#FFFFFF"));
    case "oneWayExitRight":
      return wrap(arrow(90, "#FFFFFF"));
    case "lanesDir1":
    case "lanesDir2":
    case "lanesDir3":
    case "lanesDir4":
      return wrap(
        <g>
          <g transform="translate(-8,0)">{arrow(0, "#FFFFFF")}</g>
          <g transform="translate(8,0)">{arrow(45, "#FFFFFF")}</g>
        </g>
      );
    case "laneStart":
    case "laneStart2":
      return wrap(arrow(0, "#FFFFFF"));
    case "laneEnd":
      return wrap(
        <g>
          <g transform="translate(-6,0)">{arrow(0, "#FFFFFF")}</g>
          <g transform="translate(6,0)">{arrow(20, "#FFFFFF")}</g>
        </g>
      );
    case "laneCount":
      return wrap(
        <text x="0" y="6" fontSize="14" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">3</text>
      );
    case "busLane":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-8" y="-10" width="16" height="10" rx="1" />
          {arrow(0, "#FFFFFF")}
        </g>
      );
    case "busLaneRoad1":
    case "busLaneRoad2":
    case "busLaneRoad3":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-14" y="-6" width="12" height="8" rx="1" />
          <path d="M4,10 L4,-10 L12,-10 L12,10" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        </g>
      );
    case "busLaneRoadEnd":
      return wrap(
        <g>
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
          <rect x="-14" y="-6" width="12" height="8" rx="1" fill="#FFFFFF" />
        </g>
      );
    case "uTurnPlace":
      return wrap(
        <path d="M6,12 L6,-4 A8,8 0 0 0 -10,-4 L-10,2" stroke="#FFFFFF" strokeWidth="3" fill="none" markerEnd="url(#a)" />
      );
    case "uTurnGap":
      return wrap(
        <g>
          <path d="M6,12 L6,-4 A8,8 0 0 0 -10,-4 L-10,2" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <text x="0" y="-10" fontSize="7" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">15м</text>
        </g>
      );
    case "busStop":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-9" y="-6" width="18" height="10" rx="2" />
          <circle cx="-4" cy="6" r="2" />
          <circle cx="4" cy="6" r="2" />
        </g>
      );
    case "tramStop":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-9" y="-8" width="18" height="10" rx="2" />
          <circle cx="-4" cy="4" r="2" />
          <circle cx="4" cy="4" r="2" />
          <polygon points="0,-8 0,-14 6,-14 6,-11" />
        </g>
      );
    case "taxiStop":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-9" y="-4" width="18" height="8" rx="2" />
          <circle cx="0" cy="-10" r="4" />
        </g>
      );
    case "parking":
      return wrap(
        <text x="0" y="7" fontSize="18" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">P</text>
      );
    case "crosswalk1":
    case "crosswalk2":
      return wrap(
        <g>
          <g transform="translate(-6,-4) scale(0.7)">{personIcon("#FFFFFF")}</g>
          <g fill="#FFFFFF">
            <rect x="-4" y="4" width="3" height="10" />
            <rect x="1" y="4" width="3" height="10" />
            <rect x="6" y="4" width="3" height="10" />
          </g>
        </g>
      );
    case "underpass":
    case "underpass2":
      return wrap(stairsIcon(true));
    case "overpass":
    case "overpass2":
      return wrap(stairsIcon(false));
    case "recSpeed":
      return wrap(
        <text x="0" y="6" fontSize="16" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">50</text>
      );
    case "deadEnd1":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-2.5" y="-12" width="5" height="24" />
          <rect x="-12" y="-2.5" width="24" height="5" />
        </g>
      );
    case "deadEnd2":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-12" y="-12" width="6" height="24" />
          <rect x="-2.5" y="-2.5" width="16" height="5" />
        </g>
      );
    case "deadEnd3":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="6" y="-12" width="6" height="24" />
          <rect x="-14" y="-2.5" width="16" height="5" />
        </g>
      );
    case "directionSign1":
    case "directionSign2":
      return wrap(
        <g fill="#1F2937" fontFamily="Arial, sans-serif">
          <text x="0" y="4" fontSize="7" fontWeight="700" textAnchor="middle">TOSHKENT</text>
        </g>
      );
    case "movementScheme":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2.5" fill="none">
          <rect x="-8" y="-8" width="16" height="16" />
          <line x1="-16" y1="0" x2="-8" y2="0" />
          <line x1="8" y1="0" x2="16" y2="0" />
        </g>
      );
    case "directionArrow1":
    case "directionArrow2":
      return wrap(
        <g fill="#1F2937" fontFamily="Arial, sans-serif">
          <text x="0" y="4" fontSize="7" fontWeight="700" textAnchor="middle">TOSHKENT</text>
        </g>
      );
    case "cityStart":
    case "cityStart2":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#1F2937">
          <text x="0" y="4" fontSize="7" fontWeight="700" textAnchor="middle">CHIRCHIQ</text>
        </g>
      );
    case "cityEnd":
    case "cityEnd2":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#1F2937">
          <text x="0" y="4" fontSize="7" fontWeight="700" textAnchor="middle">CHIRCHIQ</text>
          <line x1="-14" y1="10" x2="14" y2="-10" stroke="#E4231C" strokeWidth="2.5" />
        </g>
      );
    case "placeName":
      return wrap(
        <text x="0" y="4" fontSize="7" fontWeight="700" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">CHOR-SU</text>
      );
    case "distanceSign":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#FFFFFF" fontSize="6" fontWeight="700">
          <text x="0" y="-3" textAnchor="middle">GULISTON 14</text>
          <text x="0" y="4" textAnchor="middle">JIZZAX 142</text>
          <text x="0" y="11" textAnchor="middle">NAVOI 698</text>
        </g>
      );
    case "kmSign":
      return wrap(
        <text x="0" y="5" fontSize="12" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">1205</text>
      );
    case "roadNumber":
      return wrap(
        <text x="0" y="5" fontSize="12" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">M10</text>
      );
    case "truckDir1":
    case "truckDir2":
    case "truckDir3":
      return wrap(truckIcon("#FFFFFF"));
    case "detourScheme":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2" fill="none">
          <rect x="-10" y="-10" width="20" height="20" />
          <circle cx="0" cy="0" r="5" />
        </g>
      );
    case "detourDir1":
    case "detourDir2":
    case "detourDir3":
      return wrap(
        <text x="0" y="4" fontSize="7" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">CHETLAB O'TISH</text>
      );
    case "stopSign":
      return wrap(
        <text x="0" y="4" fontSize="10" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">STOP</text>
      );
    case "laneMerge1":
    case "laneMerge2":
      return wrap(
        <g>
          <g transform="translate(-6,0)">{arrow(-20, "#FFFFFF")}</g>
          <g transform="translate(6,0)">{arrow(0, "#FFFFFF")}</g>
        </g>
      );
    case "reversible":
      return wrap(
        <g fill="#FFFFFF">
          <polygon points="0,-14 -6,-4 6,-4" />
          <polygon points="0,14 -6,4 6,4" />
        </g>
      );
    case "reversibleEnd":
      return wrap(
        <g>
          <g fill="#FFFFFF">
            <polygon points="0,-14 -6,-4 6,-4" />
            <polygon points="0,14 -6,4 6,4" />
          </g>
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );
    case "reversibleExit":
      return wrap(
        <g fill="#FFFFFF">
          <path d="M-8,10 Q-8,-10 0,-10 Q8,-10 8,4" strokeWidth="2" stroke="#FFFFFF" fill="none" />
        </g>
      );
    case "livingZone":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-10" y="-2" width="20" height="10" rx="1" />
          <polygon points="-10,-2 0,-12 10,-2" />
          <circle cx="6" cy="10" r="2" />
        </g>
      );
    case "livingZoneEnd":
      return wrap(
        <g>
          <g fill="#FFFFFF">
            <rect x="-10" y="-2" width="20" height="10" rx="1" />
            <polygon points="-10,-2 0,-12 10,-2" />
          </g>
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );
    case "emergencyEntry":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2.5" fill="none">
          <path d="M-10,10 L4,-10 L14,-10" />
        </g>
      );
    case "photoVideo":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-10" y="-6" width="20" height="14" rx="2" />
          <circle cx="0" cy="1" r="5" fill="#2465B0" />
          <rect x="5" y="-9" width="6" height="4" />
        </g>
      );
    case "radar":
      return wrap(
        <g fill="#FFFFFF" fontFamily="Arial, sans-serif">
          <rect x="-10" y="-10" width="20" height="12" rx="2" />
          <text x="0" y="12" fontSize="7" fontWeight="800" textAnchor="middle">RADAR</text>
        </g>
      );
    case "redRightTurn":
      return wrap(arrow(90, "#10B981"));
    case "bikeLaneStart":
      return wrap(bikeIcon("#FFFFFF"));
    case "bikeLaneEnd":
      return wrap(
        <g>
          {bikeIcon("#FFFFFF")}
          <line x1="-14" y1="14" x2="14" y2="-14" stroke="#E4231C" strokeWidth="3" />
        </g>
      );

    // ---- Service (green icons) ----
    case "medical":
      return wrap(
        <g fill="#10B981">
          <rect x="-2.5" y="-12" width="5" height="24" />
          <rect x="-12" y="-2.5" width="24" height="5" />
        </g>
      );
    case "hospital":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-10" y="-2" width="20" height="10" rx="1" />
          <rect x="-4" y="-8" width="8" height="8" />
        </g>
      );
    case "fuel":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-8" y="-10" width="12" height="20" rx="1" />
          <path d="M4,-4 L8,-8 L8,6 Q8,10 4,10" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        </g>
      );
    case "repair":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-2.5" y="-12" width="5" height="18" rx="1" />
          <circle cx="0" cy="8" r="4" />
        </g>
      );
    case "carWash":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-10" y="-10" width="20" height="8" rx="2" />
          <line x1="-6" y1="0" x2="-6" y2="10" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="6" y1="0" x2="6" y2="10" stroke="#FFFFFF" strokeWidth="2" />
        </g>
      );
    case "phone":
      return wrap(
        <path d="M-8,-10 Q-2,-10 -2,-4 Q-2,0 -6,0 Q-4,6 2,8 Q2,4 8,4 Q10,10 10,10" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
      );
    case "restaurant":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2" fill="none">
          <line x1="-6" y1="-12" x2="-6" y2="12" />
          <line x1="-9" y1="-12" x2="-9" y2="-4" />
          <line x1="-3" y1="-12" x2="-3" y2="-4" />
          <path d="M6,-12 L6,12 M3,-12 L3,-2 Q3,2 9,2 L9,-12" />
        </g>
      );
    case "water":
      return wrap(
        <path d="M0,-12 Q8,0 8,6 A8,8 0 1 1 -8,6 Q-8,0 0,-12 Z" fill="#FFFFFF" />
      );
    case "hotel":
      return wrap(
        <g fill="#FFFFFF">
          <rect x="-10" y="0" width="20" height="8" rx="1" />
          <rect x="-10" y="-8" width="10" height="8" rx="1" />
        </g>
      );
    case "camping":
      return wrap(
        <polygon points="0,-12 10,10 -10,10" fill="#FFFFFF" />
      );
    case "restArea":
      return wrap(
        <g fill="#FFFFFF">
          <polygon points="0,-12 8,-2 -8,-2" />
          <rect x="-1.5" y="-2" width="3" height="14" />
          <rect x="-8" y="6" width="16" height="2" />
        </g>
      );
    case "ypx":
      return wrap(
        <text x="0" y="5" fontSize="12" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">YPX</text>
      );
    case "customsControl":
      return wrap(truckIcon("#FFFFFF"));
    case "wc":
      return wrap(
        <text x="0" y="5" fontSize="12" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">WC</text>
      );
    case "trash":
      return wrap(
        <g fill="#FFFFFF">
          <path d="M-5,-6 L5,-6 L4,10 L-4,10 Z" />
          <rect x="-6" y="-8" width="12" height="2" />
        </g>
      );
    case "pool":
      return wrap(
        <g stroke="#FFFFFF" strokeWidth="2.5" fill="none">
          <path d="M-12,4 Q-6,-2 0,4 T12,4" />
          <circle cx="4" cy="-6" r="3" fill="#FFFFFF" stroke="none" />
        </g>
      );
    case "police":
      return wrap(
        <text x="0" y="4" fontSize="7" fontWeight="800" fill="#FFFFFF" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">POLISIYA</text>
      );

    // ---- Additional info (black text/marks on white rect) ----
    case "distText":
      return wrap(<text x="0" y="5" fontSize="10" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">300м</text>);
    case "distText2":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#1F2937">
          <text x="0" y="-2" fontSize="8" fontWeight="800" textAnchor="middle">STOP</text>
          <text x="0" y="9" fontSize="8" fontWeight="800" textAnchor="middle">250м</text>
        </g>
      );
    case "distText3":
      return wrap(<text x="0" y="5" fontSize="9" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">100м→</text>);
    case "distText4":
      return wrap(<text x="0" y="5" fontSize="9" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">←300м</text>);
    case "zoneText":
      return wrap(<text x="0" y="5" fontSize="9" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">↑300м↑</text>);
    case "zoneUp":
      return wrap(arrow(0, "#1F2937"));
    case "zoneDown":
      return wrap(arrow(180, "#1F2937"));
    case "zoneUpDown":
      return wrap(
        <g>
          <g transform="translate(-4,0)">{arrow(0, "#1F2937")}</g>
          <g transform="translate(4,0)">{arrow(180, "#1F2937")}</g>
        </g>
      );
    case "zoneRight":
      return wrap(arrow(90, "#1F2937"));
    case "zoneLeft":
      return wrap(arrow(-90, "#1F2937"));
    case "arrowRightOnly":
      return wrap(arrow(90, "#1F2937"));
    case "arrowLeftOnly":
      return wrap(arrow(-90, "#1F2937"));
    case "arrowBothSides":
      return wrap(
        <g>
          <g transform="translate(-6,0)">{arrow(-90, "#1F2937")}</g>
          <g transform="translate(6,0)">{arrow(90, "#1F2937")}</g>
        </g>
      );
    case "vehTruck":
      return wrap(truckIcon("#1F2937"));
    case "vehTruckTrailer":
      return wrap(truckIcon("#1F2937"));
    case "vehCar":
      return wrap(carIcon("#1F2937"));
    case "vehBus":
      return wrap(
        <g fill="#1F2937">
          <rect x="-12" y="-8" width="24" height="12" rx="2" />
          <circle cx="-6" cy="6" r="2.5" />
          <circle cx="6" cy="6" r="2.5" />
        </g>
      );
    case "vehTractor":
      return wrap(tractorIcon("#1F2937"));
    case "vehMoto":
      return wrap(motoIcon("#1F2937"));
    case "vehBike":
      return wrap(bikeIcon("#1F2937"));
    case "vehHazmat":
      return wrap(
        <g fill="#E4231C">
          <rect x="-6" y="-8" width="12" height="12" />
        </g>
      );
    case "weekendMark":
      return wrap(<text x="0" y="6" fontSize="16" fill="#E4231C" stroke="none" textAnchor="middle">✳</text>);
    case "workdayMark":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2.5">
          <line x1="-8" y1="-8" x2="8" y2="8" />
          <line x1="-8" y1="8" x2="8" y2="-8" />
        </g>
      );
    case "weekdaysText":
      return wrap(<text x="0" y="4" fontSize="6" fontWeight="700" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">DUSHANBA-CHORSHANB</text>);
    case "weekdaysText2":
      return wrap(<text x="0" y="4" fontSize="6" fontWeight="700" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">DUSHANBA-CHORSHANB</text>);
    case "timeText":
      return wrap(<text x="0" y="5" fontSize="9" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">8.00-17.00</text>);
    case "timeWeekend":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#1F2937">
          <text x="0" y="-2" fontSize="8" fontWeight="800" textAnchor="middle">8.00-17.00</text>
          <text x="0" y="9" fontSize="10" fill="#E4231C" textAnchor="middle">✳</text>
        </g>
      );
    case "timeWorkday":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#1F2937">
          <text x="0" y="-2" fontSize="8" fontWeight="800" textAnchor="middle">8.00-17.00</text>
          <g transform="translate(0,8)" stroke="#1F2937" strokeWidth="1.5">
            <line x1="-4" y1="-3" x2="4" y2="3" />
            <line x1="-4" y1="3" x2="4" y2="-3" />
          </g>
        </g>
      );
    case "parkMethod1":
    case "parkMethod2":
    case "parkMethod3":
    case "parkMethod4":
    case "parkMethod5":
    case "parkMethod6":
    case "parkMethod7":
    case "parkMethod8":
      return wrap(
        <g fill="#1F2937">
          <rect x="-14" y="4" width="28" height="2.5" />
          {carIcon("#1F2937", 0, 0.7)}
        </g>
      );
    case "noEngineParking":
      return wrap(
        <g fill="#1F2937">
          {carIcon("#1F2937")}
          <line x1="8" y1="-10" x2="8" y2="4" stroke="#E4231C" strokeWidth="2" />
        </g>
      );
    case "paidService":
      return wrap(
        <g fontFamily="Arial, sans-serif" fill="#1F2937">
          <text x="-8" y="4" fontSize="7" fontWeight="800">10</text>
          <text x="0" y="4" fontSize="7" fontWeight="800">25</text>
          <text x="8" y="4" fontSize="7" fontWeight="800">50</text>
        </g>
      );
    case "parkDuration":
      return wrap(<text x="0" y="5" fontSize="9" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">30daq</text>);
    case "inspection":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2" fill="none">
          <path d="M-12,6 L-12,-2 L12,-2 L12,6" />
        </g>
      );
    case "totalWeight":
      return wrap(<text x="0" y="5" fontSize="11" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle" fontFamily="Arial, sans-serif">15т</text>);
    case "dangerShoulder":
      return wrap(
        <g fill="#1F2937">
          <path d="M-12,8 L-2,8 L4,-8 L14,-8" stroke="#1F2937" strokeWidth="2" fill="none" />
        </g>
      );
    case "mainRoadDir":
      return wrap(
        <g stroke="#1F2937" strokeWidth="3" fill="none">
          <path d="M-10,10 L-10,0 L10,0" />
        </g>
      );
    case "movementLane":
      return wrap(arrow(180, "#1F2937"));
    case "blindPedestrian":
      return wrap(
        <g stroke="#1F2937" strokeWidth="2" fill="#1F2937">
          <circle cx="-4" cy="-9" r="4" fill="none" />
          <circle cx="4" cy="-9" r="4" fill="none" />
          <line x1="-8" y1="-9" x2="-10" y2="-11" />
        </g>
      );
    case "wetSurface":
      return wrap(
        <path d="M-12,4 Q-4,-4 4,4 T14,0" stroke="#1F2937" strokeWidth="2.5" fill="none" />
      );
    case "disabled":
      return wrap(
        <g fill="#1F2937">
          <circle cx="4" cy="-8" r="2.5" />
          <path d="M4,-5 L4,2 M-4,10 A6,6 0 1 1 6,4" stroke="#1F2937" strokeWidth="2" fill="none" />
        </g>
      );
    case "disabledExcept":
      return wrap(
        <g fill="#1F2937">
          <circle cx="4" cy="-8" r="2.5" />
          <path d="M4,-5 L4,2 M-4,10 A6,6 0 1 1 6,4" stroke="#1F2937" strokeWidth="2" fill="none" />
          <text x="0" y="-14" fontSize="6" fontWeight="800" textAnchor="middle">mustasno</text>
        </g>
      );
    case "intersectionCamera":
      return wrap(
        <g fill="#1F2937">
          <rect x="-8" y="-6" width="16" height="10" rx="2" />
          <circle cx="0" cy="-1" r="3.5" fill="#FFFFFF" />
        </g>
      );
    case "hazmatClass":
      return wrap(
        <g fill="#E4231C">
          <polygon points="0,-10 3,-2 10,-2 4,3 6,10 0,6 -6,10 -4,3 -10,-2 -3,-2" />
        </g>
      );
    case "towTruck":
      return wrap(
        <g fill="#1F2937">
          <rect x="-10" y="-4" width="14" height="8" rx="1" />
          <circle cx="-6" cy="6" r="2" />
          <circle cx="2" cy="6" r="2" />
          <line x1="4" y1="-2" x2="12" y2="-10" stroke="#1F2937" strokeWidth="2" />
        </g>
      );
    case "metroSign":
      return wrap(<text x="0" y="5" fontSize="14" fontWeight="800" fill="#1F2937" stroke="none" textAnchor="middle">M</text>);
    case "busSign":
      return wrap(
        <g fill="#1F2937">
          <rect x="-8" y="-6" width="16" height="8" rx="1" />
        </g>
      );
    case "tramSign":
      return wrap(
        <g fill="#1F2937">
          <rect x="-8" y="-4" width="16" height="8" rx="1" />
          <line x1="0" y1="-4" x2="0" y2="-10" stroke="#1F2937" strokeWidth="1.5" />
        </g>
      );
    case "barrier":
      return wrap(
        <g fill="#E4231C">
          <polygon points="-10,10 -2,10 6,-10 -2,-10" />
          <polygon points="4,10 12,10 4,-10 -4,-10" opacity="0.001" />
        </g>
      );

    default:
      return null;
  }
}

function carIcon(color = "#FFFFFF", dx = 0, sc = 1) {
  return (
    <g transform={`translate(${dx},0) scale(${sc})`} fill={color}>
      <rect x="-9" y="-3" width="18" height="7" rx="2" />
      <rect x="-5" y="-8" width="10" height="6" rx="1" />
      <circle cx="-5" cy="5" r="2" />
      <circle cx="5" cy="5" r="2" />
    </g>
  );
}
function carIconOutline() {
  return (
    <g fill="none" stroke="#FFFFFF" strokeWidth="1.5">
      <rect x="-9" y="-3" width="18" height="7" rx="2" />
      <rect x="-5" y="-8" width="10" height="6" rx="1" />
    </g>
  );
}
function truckIcon(color = "#FFFFFF") {
  return (
    <g fill={color}>
      <rect x="-12" y="-4" width="16" height="10" rx="1" />
      <path d="M4,-4 L10,-4 L14,2 L14,6 L4,6 Z" />
      <circle cx="-7" cy="8" r="2" />
      <circle cx="9" cy="8" r="2" />
    </g>
  );
}
function motoIcon(color = "#FFFFFF") {
  return (
    <g fill="none" stroke={color} strokeWidth="2">
      <circle cx="-7" cy="6" r="3" />
      <circle cx="7" cy="6" r="3" />
      <path d="M-7,6 L-2,-4 L4,-4 M4,-4 L7,6 M-2,-4 L2,2 L7,6" />
    </g>
  );
}
function tractorIcon(color = "#FFFFFF") {
  return (
    <g fill="none" stroke={color} strokeWidth="2">
      <circle cx="-6" cy="7" r="4" />
      <circle cx="7" cy="8" r="2.5" />
      <path d="M-6,3 L-6,-6 L2,-6 L2,2 L10,2" />
    </g>
  );
}
function bikeIcon(color = "#1F2937") {
  return (
    <g fill="none" stroke={color} strokeWidth="2">
      <circle cx="-7" cy="6" r="4.5" />
      <circle cx="7" cy="6" r="4.5" />
      <path d="M-7,6 L-2,-4 L6,-4 M-2,-4 L3,6 M3,6 L7,6 M-2,-4 L-4,-7 L-7,-7" />
    </g>
  );
}
function personIcon(color = "#1F2937") {
  return (
    <g fill={color}>
      <circle cx="0" cy="-9" r="3.2" />
      <path d="M0,-5 L0,4 M-6,-1 L6,-1 M0,4 L-5,12 M0,4 L5,12" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}
function stairsIcon(down) {
  const pts = down
    ? "-10,-10 -4,-10 -4,-4 2,-4 2,2 8,2 8,10 -10,10"
    : "-10,10 -4,10 -4,4 2,4 2,-2 8,-2 8,-10 -10,-10";
  return <polygon points={pts} fill="#FFFFFF" />;
}
