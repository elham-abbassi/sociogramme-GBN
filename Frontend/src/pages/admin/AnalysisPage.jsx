import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import * as d3 from "d3";

const GROUP_COLORS = [
  "#0796cb", "#f28e2b", "#e15759", "#59a14f",
  "#b07aa1", "#edc948", "#76b7b2", "#ff9da7",
  "#9c755f", "#bab0ac",
];

// One d3 symbol shape per group — first group gets circle, rest get distinct shapes
const GROUP_SHAPES = [
  d3.symbolCircle,
  d3.symbolSquare,
  d3.symbolDiamond,
  d3.symbolTriangle,
  d3.symbolStar,
  d3.symbolWye,
  d3.symbolCross,
];

// Colors used only inside groups that have permanent members
const COLOR_PERMANENT = "#c0392b";    // red — coaches / permanent
const COLOR_NONPERMANENT = "#f1a7b5"; // rose — variable staff

function getGroupColor(group, groupList) {
  const idx = groupList.indexOf(group);
  return idx >= 0 ? GROUP_COLORS[idx % GROUP_COLORS.length] : "#ccc";
}

function getGroupShape(group, groupList) {
  const idx = groupList.indexOf(group);
  return idx >= 0 ? GROUP_SHAPES[idx % GROUP_SHAPES.length] : d3.symbolCircle;
}

// Only groups that contain at least one permanent member get the red/rose split.
// Every other group keeps its standard GROUP_COLORS color untouched.
function resolveNodeColor(node, groups, permanentGroups) {
  if (permanentGroups.has(node.group)) {
    if (node.is_permanent === true) return COLOR_PERMANENT;
    if (node.is_permanent === false) return COLOR_NONPERMANENT;
  }
  return getGroupColor(node.group, groups);
}

function QuestionChart({ question }) {
  if (question.distribution && question.distribution.length > 0) {
    return (
      <div>
        <h4 style={{ margin: "12px 0 8px" }}>Distribution des réponses</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={question.distribution}
            margin={{ top: 5, right: 20, left: 0, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="value"
              angle={-35}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(val, name, props) => [
                `${val} réponse(s) (${props.payload.percentage}%)`,
                "Count",
              ]}
            />
            <Bar dataKey="count" fill="#4e79a7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (question.statistics) {
    const { count, mean, min, max } = question.statistics;
    return (
      <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Réponses", value: count },
          { label: "Moyenne", value: mean ?? "—" },
          { label: "Min", value: min ?? "—" },
          { label: "Max", value: max ?? "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "#f0f4ff",
              padding: "12px 20px",
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "90px",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>{value}</div>
            <div style={{ fontSize: "12px", color: "#555" }}>{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return <p style={{ color: "#888" }}>Aucune donnée disponible.</p>;
}

function Sociogram({ nodes: rawNodes, edges: rawEdges, colorBy = "group", allDepartments = [] }) {
  const svgRef = useRef(null);
  const zoomRef = useRef(null);

  // "Répondant" always first → gets circle shape; other groups get distinct shapes
  const allGroups = [...new Set(rawNodes.map((n) => n.group).filter(Boolean))];
  const groups = [
    ...allGroups.filter((g) => g === "Répondant"),
    ...allGroups.filter((g) => g !== "Répondant"),
  ];

  // Full department list for stable color mapping (same as colorKeys in effect)
  const departments = allDepartments.length > 0
    ? [...allDepartments].sort()
    : [...new Set(rawNodes.map((n) => n.department).filter(Boolean))].sort();

  // Groups that have at least one permanent member (used for legend + coloring)
  const permanentGroups = new Set(
    rawNodes.filter((n) => n.is_permanent === true).map((n) => n.group)
  );


  useEffect(() => {
    if (!svgRef.current || !rawNodes.length) return;

    const nodes = rawNodes.map((n) => ({ ...n }));
    const edges = rawEdges.map((e) => ({ ...e }));

    // In-degree: count only real "choice" edges (not membership edges)
    const inDegree = {};
    edges.forEach((e) => {
      if (e.type !== "membership") {
        inDegree[e.target] = (inDegree[e.target] || 0) + e.weight;
      }
    });
    const maxDegree = Math.max(1, ...Object.values(inDegree));
    // Area scale: nodes with 0 choices → small, max choices → large
    const sizeScale = d3.scaleSqrt().domain([0, maxDegree]).range([300, 2200]);
    // Collision radius derived from symbol area (≈ √(area/π))
    const collisionRadius = (d) => Math.sqrt(sizeScale(inDegree[d.id] || 0) / Math.PI) + 8;

    // Recompute groups/departments here so the closure is always fresh
    const allGrps = [...new Set(nodes.map((n) => n.group).filter(Boolean))];
    const groups = [
      ...allGrps.filter((g) => g === "Répondant"),
      ...allGrps.filter((g) => g !== "Répondant"),
    ];
    // Use full department list for stable colors (not just what's in filtered nodes)
    const depts = allDepartments.length > 0
      ? [...allDepartments].sort()
      : [...new Set(nodes.map((n) => n.department).filter(Boolean))].sort();
    const colorKeys = colorBy === "department" ? depts : groups;
    // Groups that have at least one permanent member → get the red/rose split
    const permanentGroups = new Set(
      nodes.filter((n) => n.is_permanent === true).map((n) => n.group)
    );
    const resolveColor = (d) =>
      colorBy === "department"
        ? getGroupColor(d.department || "—", colorKeys)
        : resolveNodeColor(d, groups, permanentGroups);

    const width = svgRef.current.parentElement.clientWidth || 800;
    const height = 580;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f8f9fa")
      .style("border-radius", "8px")
      .style("cursor", "move");

    // Arrow marker (refX = 0 — we shorten the line itself to stop at the node edge)
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "#aaa");

    // Container group — zoom transforms this
    const container = svg.append("g");

    // Zoom behaviour
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = { zoom, svg };

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id((d) => d.id).distance(130))
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(collisionRadius));

    const link = container
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d) => d.type === "membership" ? "#68b7ce" : "#bbb")
      .attr("stroke-opacity", (d) => d.type === "membership" ? 0.5 : 0.8)
      .attr("stroke-width", (d) => d.type === "membership" ? 1.5 : Math.max(1, Math.sqrt(d.weight) * 1.5))
      .attr("stroke-dasharray", (d) => d.type === "membership" ? "5,4" : null)
      .attr("marker-end", (d) => d.type === "membership" ? null : "url(#arrowhead)");

    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "grab")
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("path")
      .attr("d", (d) =>
        d3.symbol().type(getGroupShape(d.group, groups)).size(sizeScale(inDegree[d.id] || 0))()
      )
      .attr("fill", resolveColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5);

    // Label positioned below the node, offset based on its size
    node
      .append("text")
      .text((d) => (d.id.length > 14 ? d.id.substring(0, 14) + "…" : d.id))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => Math.sqrt(sizeScale(inDegree[d.id] || 0) / Math.PI) + 14)
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("pointer-events", "none");

    // Count badge — shows number of times chosen (if > 0)
    node
      .filter((d) => (inDegree[d.id] || 0) > 0)
      .append("text")
      .text((d) => inDegree[d.id])
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", (d) => `${Math.max(9, Math.min(14, 8 + inDegree[d.id]))}px`)
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => {
          if (d.type === "membership") return d.target.x;
          const r = Math.sqrt(sizeScale(inDegree[d.target.id] || 0) / Math.PI) + 4;
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.target.x - (dx / dist) * r;
        })
        .attr("y2", (d) => {
          if (d.type === "membership") return d.target.y;
          const r = Math.sqrt(sizeScale(inDegree[d.target.id] || 0) / Math.PI) + 4;
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return d.target.y - (dy / dist) * r;
        });
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [rawNodes, rawEdges, colorBy, allDepartments]);

  const handleZoom = (factor) => {
    if (!zoomRef.current) return;
    const { zoom, svg } = zoomRef.current;
    svg.transition().duration(300).call(zoom.scaleBy, factor);
  };

  const handleReset = () => {
    if (!zoomRef.current) return;
    const { zoom, svg } = zoomRef.current;
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  };

  return (
    <div>
      {/* Legend */}
      {colorBy === "group" && groups.length > 0 && (
        <div className="legend-row">
          {groups.flatMap((group) => {
            const shape = getGroupShape(group, groups);
            const sym = (color) => (
              <svg width="20" height="20" style={{ flexShrink: 0 }}>
                <g transform="translate(10,10)">
                  <path d={d3.symbol().type(shape).size(200)()} fill={color} stroke="#fff" strokeWidth="1.5" />
                </g>
              </svg>
            );

            if (permanentGroups.has(group)) {
              // This group has permanent members → show two entries (red + rose)
              const hasPerm = rawNodes.some((n) => n.group === group && n.is_permanent === true);
              const hasNonPerm = rawNodes.some((n) => n.group === group && n.is_permanent === false);
              const items = [];
              if (hasPerm) items.push(
                <div key={`${group}-perm`} className="legend-item">
                  {sym(COLOR_PERMANENT)}<span>{group} (coach)</span>
                </div>
              );
              if (hasNonPerm) items.push(
                <div key={`${group}-nonperm`} className="legend-item">
                  {sym(COLOR_NONPERMANENT)}<span>{group}</span>
                </div>
              );
              return items;
            }

            // Normal group — standard color
            return [
              <div key={group} className="legend-item">
                {sym(getGroupColor(group, groups))}<span>{group}</span>
              </div>
            ];
          })}
        </div>
      )}
      {/* Edge legend */}
      <div className="legend-row" style={{ marginTop: "6px" }}>
        <div className="legend-item">
          <svg width="32" height="12" style={{ flexShrink: 0 }}>
            <line x1="0" y1="6" x2="32" y2="6" stroke="#bbb" strokeWidth="2" markerEnd="url(#arrowhead)" />
          </svg>
          <span>A choisi cette personne</span>
        </div>
        <div className="legend-item">
          <svg width="32" height="12" style={{ flexShrink: 0 }}>
            <line x1="0" y1="6" x2="32" y2="6" stroke="#68b7ce" strokeWidth="1.5" strokeDasharray="5,4" />
          </svg>
          <span>Appartient à ce département</span>
        </div>
      </div>

      {colorBy === "department" && departments.length > 0 && (
        <div className="legend-row">
          {departments.map((dept, i) => (
            <div key={dept} className="legend-item">
              <div
                className="legend-dot"
                style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }}
              />
              <span>{dept}</span>
            </div>
          ))}
          {rawNodes.some((n) => !n.department) && (
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#ccc" }} />
              <span>Département inconnu</span>
            </div>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button className="btn btn-secondary" onClick={() => handleZoom(1.3)} style={{ padding: "4px 12px", fontSize: "18px" }}>+</button>
        <button className="btn btn-secondary" onClick={() => handleZoom(0.7)} style={{ padding: "4px 12px", fontSize: "18px" }}>−</button>
        <button className="btn btn-secondary" onClick={handleReset} style={{ padding: "4px 12px", fontSize: "13px" }}>Reset</button>
        <span style={{ color: "var(--text-light)", fontSize: "12px", alignSelf: "center" }}>
          Scroll pour zoomer · Glisser le fond pour déplacer · Glisser un nœud pour le bouger
        </span>
      </div>

      <svg ref={svgRef} style={{ width: "100%", display: "block" }} />
    </div>
  );
}

function IsolatedView({ nodes, edges }) {
  const svgRef = useRef(null);
  const W = 900;
  const H = 620;

  // Hoist groups so the JSX header can use them
  const allGroupsTop = [...new Set(nodes.map((n) => n.group).filter(Boolean))];
  const groups = [
    ...allGroupsTop.filter((g) => g === "Répondant"),
    ...allGroupsTop.filter((g) => g !== "Répondant"),
  ];
  const permanentGroupsTop = new Set(
    nodes.filter((n) => n.is_permanent === true).map((n) => n.group)
  );

  useEffect(() => {
    if (!nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const allGroups = [...new Set(nodes.map((n) => n.group).filter(Boolean))];
    const groups = [
      ...allGroups.filter((g) => g === "Répondant"),
      ...allGroups.filter((g) => g !== "Répondant"),
    ];
    const permanentGroups = new Set(
      nodes.filter((n) => n.is_permanent === true).map((n) => n.group)
    );

    // In-degree from choice edges for node sizing
    const inDegree = {};
    (edges || []).forEach((e) => {
      if (e.type === "choice") {
        inDegree[e.target] = (inDegree[e.target] || 0) + (e.weight || 1);
      }
    });
    const maxDeg = Math.max(1, ...Object.values(inDegree));
    const sizeScale = d3.scaleSqrt().domain([0, maxDeg]).range([260, 1800]);

    // Place each group's centre on a circle around the canvas centre
    const cx = W / 2;
    const cy = H / 2;
    const layoutR = groups.length === 1 ? 0 : Math.min(W, H) * 0.28;
    const groupCenters = {};
    groups.forEach((g, i) => {
      const angle = (i / groups.length) * 2 * Math.PI - Math.PI / 2;
      groupCenters[g] = {
        x: cx + layoutR * Math.cos(angle),
        y: cy + layoutR * Math.sin(angle),
      };
    });

    // Bubble radius per group (grows with member count)
    const bubbleR = (g) => Math.max(70, Math.sqrt(nodes.filter((n) => n.group === g).length) * 42);

    // Root SVG
    const root = svg.append("g");

    // Zoom
    svg.call(
      d3.zoom().scaleExtent([0.3, 3]).on("zoom", (ev) => root.attr("transform", ev.transform))
    );

    // (group labels are rendered in the JSX header above the SVG)

    // Simulation nodes — start near their group centre
    const simNodes = nodes.map((n) => {
      const c = groupCenters[n.group] || { x: cx, y: cy };
      return { ...n, x: c.x + (Math.random() - 0.5) * 40, y: c.y + (Math.random() - 0.5) * 40 };
    });

    const sim = d3.forceSimulation(simNodes)
      .force("collide", d3.forceCollide().radius((d) => {
        return Math.sqrt(sizeScale(inDegree[d.id] || 0) / Math.PI) + 6;
      }).strength(0.85))
      .force("center", d3.forceCenter(cx, cy).strength(0.04))
      .alphaDecay(0.025);

    // Node elements
    const nodeG = root.append("g");
    const nodeEls = nodeG.selectAll(".iso-node")
      .data(simNodes)
      .join("g")
      .attr("class", "iso-node")
      .style("cursor", "grab")
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    nodeEls.append("path")
      .attr("d", (d) =>
        d3.symbol().type(getGroupShape(d.group, groups)).size(sizeScale(inDegree[d.id] || 0))()
      )
      .attr("fill", (d) => resolveNodeColor(d, groups, permanentGroups))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.8);

    // Count badge
    nodeEls.filter((d) => (inDegree[d.id] || 0) > 0)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "9px")
      .attr("font-weight", "700")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .text((d) => inDegree[d.id]);

    // Name label below node
    nodeEls.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "var(--text)")
      .attr("pointer-events", "none")
      .attr("y", (d) => Math.sqrt(sizeScale(inDegree[d.id] || 0) / Math.PI) + 12)
      .text((d) => d.id);

    sim.on("tick", () => {
      nodeEls.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [nodes, edges]);

  return (
    <div>
      {/* Group legend header */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
        {groups.map((g) => {
          const col = getGroupColor(g, groups);
          const count = nodes.filter((n) => n.group === g).length;
          const hasPermanent = permanentGroupsTop.has(g);
          return (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: hasPermanent ? COLOR_PERMANENT : col }} />
              <span style={{ fontWeight: "600", color: col }}>{g}</span>
              <span style={{ color: "var(--text-light)" }}>({count})</span>
            </div>
          );
        })}
      </div>

      <svg
        ref={svgRef}
        style={{ width: "100%", height: `${H}px`, background: "#f8f9fa", borderRadius: "8px", display: "block" }}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
}

function SociogramWithFilters({ nodes, edges, allDepartments = [] }) {
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [viewBy, setViewBy] = useState(null);   // null | "department" | "coach"
  const [selectedSub, setSelectedSub] = useState("all");
  const [viewMode, setViewMode] = useState("sociogram"); // "sociogram" | "isolated"

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const targetGroups = [...new Set(nodes.map((n) => n.group).filter(Boolean))];

  const isValidLabel = (v) => {
    if (!v) return false;
    const s = v.trim().toLowerCase();
    return s !== "" && s !== "none" && s !== "(none)" && s !== "null" && s !== "n/a" && s !== "aucun" && s !== "aucune";
  };

  const allDepts = (allDepartments.length > 0 ? allDepartments : [...new Set(nodes.map((n) => n.department))])
    .filter(isValidLabel)
    .sort();

  // Attribute keys available as Layer 1 tabs (Couleurs dominantes, Motivateurs…)
  // Exclude any key that duplicates an existing group name (case-insensitive)
  const groupNameSet = new Set(targetGroups.map((g) => g.toLowerCase()));
  const attrKeys = [...new Set(
    nodes.flatMap((n) => Object.keys(n.attributes || {}))
  )].filter((key) => {
    if (groupNameSet.has(key.toLowerCase())) return false;
    const vals = [...new Set(nodes.flatMap((n) => {
      const v = n.attributes?.[key];
      return Array.isArray(v) ? v : (v ? [v] : []);
    }).filter(isValidLabel))];
    return vals.length >= 1;
  });

  // Is an attribute tab selected in Layer 1?
  const isAttrTab = selectedGroup.startsWith("__attr__:");
  const attrTabKey = isAttrTab ? selectedGroup.slice(9) : null;

  // Values for the currently selected attribute tab
  const attrTabValues = attrTabKey
    ? [...new Set(nodes.flatMap((n) => {
        const v = n.attributes?.[attrTabKey];
        return Array.isArray(v) ? v : (v ? [v] : []);
      }).filter(isValidLabel))].sort()
    : [];

  // Coaches for the selected group — shown as Layer 2 buttons
  const coaches = (isAttrTab || selectedGroup === "all")
    ? []
    : nodes.filter((n) =>
        n.is_permanent === true &&
        isValidLabel(n.id) &&
        n.group === selectedGroup
      ).sort((a, b) => a.id.localeCompare(b.id));

  // Nodes belonging to the selected group (for sub-tabs)
  const groupNodes = (!isAttrTab && selectedGroup !== "all")
    ? nodes.filter((n) => n.group === selectedGroup && isValidLabel(n.id))
        .sort((a, b) => a.id.localeCompare(b.id))
    : [];

  // Groups that contain at least one coach (is_permanent===true) are staff groups.
  // Pure choice-target groups (colours, motivators) have no permanent members.
  const sourceIds = new Set(edges.map((e) => e.source));
  const groupHasCoaches = groupNodes.some((n) => n.is_permanent === true);
  const isChoiceTargetGroup = !groupHasCoaches
    && groupNodes.length > 0
    && groupNodes.every((n) => !sourceIds.has(n.id));

  const colorBy = viewBy === "department" ? "department" : "group";

  // ── Filtering ──────────────────────────────────────────────────────────────
  let filteredEdges;

  if (isAttrTab) {
    // Attribute Layer 1: filter by who has the selected attribute value
    if (selectedSub === "all") {
      filteredEdges = edges;
    } else {
      const hasVal = (node, val) => {
        const a = node?.attributes?.[attrTabKey];
        return Array.isArray(a) ? a.includes(val) : a === val;
      };
      filteredEdges = edges.filter((e) =>
        hasVal(nodeById[e.source], selectedSub) || hasVal(nodeById[e.target], selectedSub)
      );
    }
  } else {
    // Group Layer 1: filter by group, then optional sub-filter
    filteredEdges = selectedGroup === "all"
      ? edges
      : edges.filter((e) =>
          nodeById[e.source]?.group === selectedGroup ||
          nodeById[e.target]?.group === selectedGroup
        );

    if (selectedSub !== "all") {
      // Filter to edges touching the selected node (coach or color/motivator member)
      filteredEdges = filteredEdges.filter((e) =>
        e.source === selectedSub || e.target === selectedSub
      );
    }
  }

  const involvedIds = new Set();
  filteredEdges.forEach((e) => { involvedIds.add(e.source); involvedIds.add(e.target); });
  // "Tous" with no sub-filter → show every node and every edge
  const noFilterActive = selectedGroup === "all" && selectedSub === "all" && !isAttrTab;
  const filteredNodes = noFilterActive ? nodes : nodes.filter((n) => involvedIds.has(n.id));
  const visibleEdges = noFilterActive ? edges : filteredEdges;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const tabStyle = (active) => ({
    padding: "6px 14px",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: active ? "600" : "400",
    background: active ? "var(--primary)" : "var(--white)",
    color: active ? "var(--white)" : "var(--text)",
    transition: "all 0.15s",
  });

  const subTabStyle = (active) => ({
    ...tabStyle(active),
    padding: "5px 12px",
    fontSize: "12px",
    background: active ? "var(--primary-light)" : "#f4f4f4",
    color: active ? "#fff" : "var(--text)",
    border: "1px solid #ddd",
  });

  const resetSub = () => { setViewBy(null); setSelectedSub("all"); };

  return (
    <div>
      {/* Row 1 — group tabs + attribute tabs + view mode toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button style={tabStyle(selectedGroup === "all")} onClick={() => { setSelectedGroup("all"); resetSub(); }}>
            Tous
          </button>
          {targetGroups.map((g) => (
            <button key={g} style={tabStyle(selectedGroup === g)} onClick={() => { setSelectedGroup(g); resetSub(); }}>
              {g}
            </button>
          ))}
          {/* Attribute tabs (Couleurs dominantes, Motivateurs…) */}
          {attrKeys.map((key) => (
            <button
              key={key}
              style={tabStyle(selectedGroup === `__attr__:${key}`)}
              onClick={() => { setSelectedGroup(`__attr__:${key}`); setViewBy(null); setSelectedSub("all"); }}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* View mode — segmented control */}
        <div style={{ display: "inline-flex", background: "#f0f0f0", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          {[
            { value: "sociogram", label: "Sociogramme" },
            { value: "isolated", label: "Vue isolée" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              style={{
                padding: "5px 16px",
                fontSize: "13px",
                fontWeight: viewMode === value ? "600" : "400",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                background: viewMode === value ? "#fff" : "transparent",
                color: viewMode === value ? "var(--text)" : "var(--text-light)",
                boxShadow: viewMode === value ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2a — attribute value sub-tabs (when an attribute tab is active) */}
      {isAttrTab && attrTabValues.length > 0 && (
        <div style={{
          display: "flex", gap: "6px", flexWrap: "wrap",
          background: "#f4f8fb", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "10px",
        }}>
          <button style={subTabStyle(selectedSub === "all")} onClick={() => setSelectedSub("all")}>
            Tous
          </button>
          {attrTabValues.map((v) => (
            <button key={v} style={subTabStyle(selectedSub === v)} onClick={() => setSelectedSub(v)}>
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Row 2b — member sub-tabs for choice-target groups (Couleurs, Motivateurs…) */}
      {!isAttrTab && selectedGroup !== "all" && isChoiceTargetGroup && groupNodes.length > 0 && (
        <div style={{
          display: "flex", gap: "6px", flexWrap: "wrap",
          background: "#f4f8fb", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "10px",
        }}>
          <button style={subTabStyle(selectedSub === "all")} onClick={() => setSelectedSub("all")}>
            Tous
          </button>
          {groupNodes.map((n) => (
            <button key={n.id} style={subTabStyle(selectedSub === n.id)} onClick={() => setSelectedSub(n.id)}>
              {n.id}
            </button>
          ))}
        </div>
      )}

      {/* Layer 2 — Coach name buttons (for groups that have coaches) */}
      {!isAttrTab && selectedGroup !== "all" && !isChoiceTargetGroup && coaches.length > 0 && (
        <div style={{
          display: "flex", gap: "6px", flexWrap: "wrap",
          background: "#f4f8fb", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "10px",
        }}>
          <button style={subTabStyle(selectedSub === "all")} onClick={() => setSelectedSub("all")}>
            Tous
          </button>
          {coaches.map((c) => (
            <button key={c.id} style={subTabStyle(selectedSub === c.id)} onClick={() => setSelectedSub(c.id)}>
              {c.id}
            </button>
          ))}
        </div>
      )}

      {/* Layer 2 — Person dropdown (for groups with no coaches, e.g. Répondant) */}
      {!isAttrTab && selectedGroup !== "all" && !isChoiceTargetGroup && coaches.length === 0 && groupNodes.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "#f4f8fb", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "10px",
        }}>
          <span style={{ fontSize: "12px", color: "var(--text-light)", whiteSpace: "nowrap" }}>
            Filtrer par personne :
          </span>
          <select
            className="input"
            style={{ minWidth: "200px", padding: "5px 10px", fontSize: "13px" }}
            value={selectedSub}
            onChange={(e) => setSelectedSub(e.target.value)}
          >
            <option value="all">Toutes les personnes</option>
            {groupNodes.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
          {selectedSub !== "all" && (
            <button
              style={{ ...subTabStyle(false), color: "var(--text-light)" }}
              onClick={() => setSelectedSub("all")}
            >
              ✕
            </button>
          )}
        </div>
      )}

      <p style={{ fontSize: "12px", color: "var(--text-light)", marginBottom: "8px" }}>
        {filteredNodes.length} personne(s) · {visibleEdges.length} interaction(s)
      </p>

      {viewMode === "isolated" ? (
        <IsolatedView nodes={filteredNodes} edges={visibleEdges} />
      ) : visibleEdges.length === 0 && filteredNodes.length === 0 ? (
        <p style={{ color: "var(--text-light)", padding: "40px", textAlign: "center", background: "#f8f9fa", borderRadius: "8px" }}>
          Aucune interaction trouvée pour cette sélection.
        </p>
      ) : (
        <Sociogram
          nodes={filteredNodes}
          edges={visibleEdges}
          colorBy={colorBy}
          allDepartments={allDepts}
        />
      )}
    </div>
  );
}

function DepartmentChart({ interactions }) {
  const data = interactions.map((d) => ({
    name: `${d.from} → ${d.to}`,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 90 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-40}
          textAnchor="end"
          interval={0}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#76b7b2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AnalysisPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analysisRes, deptsRes] = await Promise.all([
          api.get(`/analysis/${id}/`),
          api.get("/questionnaires/departments/"),
        ]);
        setAnalysis(analysisRes.data);
        setAllDepartments(deptsRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'analyse.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <><Navbar /><p className="loading">Chargement de l'analyse...</p></>;
  if (error)   return <><Navbar /><p className="error">{error}</p></>;
  if (!analysis) return <><Navbar /><p className="loading">Aucune analyse trouvée.</p></>;

  const hasSociogram = analysis.sociogram?.nodes?.length > 0;
  const hasDeptInteractions = analysis.department_interactions?.length > 0;
  const totalResponses = analysis.questions[0]?.total_answers ?? 0;

  return (
    <>
    <Navbar />
    <div className="page">
      <Link to="/admin" className="back-link">← Retour au dashboard</Link>

      <h1>Analyse : {analysis.title}</h1>

      {/* ── Overview stats ── */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{totalResponses}</div>
          <div className="stat-label">Réponses au total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analysis.questions.length}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analysis.sociogram?.nodes?.length ?? 0}</div>
          <div className="stat-label">Personnes dans le sociogramme</div>
        </div>
      </div>

      {/* ── Sociogram ── */}
      {hasSociogram ? (
        <div style={{ marginBottom: "40px" }}>
          <h2>Sociogramme</h2>
          <SociogramWithFilters
            nodes={analysis.sociogram.nodes}
            edges={analysis.sociogram.edges}
            allDepartments={allDepartments}
          />
        </div>
      ) : (
        <p style={{ color: "#888", marginBottom: "32px" }}>
          Aucune donnée de sociogramme disponible. Les questions de type{" "}
          <em>choix multiple</em> avec des noms de personnes génèrent le sociogramme.
        </p>
      )}

      {/* ── Department interactions ── */}
      {hasDeptInteractions && (
        <div style={{ marginBottom: "40px" }}>
          <h2>Interactions entre départements</h2>
          <p style={{ color: "var(--text-light)", fontSize: "13px", marginTop: "-8px", marginBottom: "16px" }}>
            Nombre de fois qu'un membre d'un département a choisi un membre d'un autre département.
            Permet d'identifier les liens forts et les silos entre équipes.
          </p>
          <DepartmentChart interactions={analysis.department_interactions} />
        </div>
      )}

      {/* ── Per-question detail (collapsible) ── */}
      <div style={{ marginBottom: "40px" }}>
        <button className="collapse-btn" onClick={() => setDetailOpen((o) => !o)}>
          <span>{detailOpen ? "▼" : "▶"}</span>
          Détail par question ({analysis.questions.length} questions)
        </button>

        {detailOpen && (
          <div style={{ marginTop: "16px" }}>
            {analysis.questions.map((question) => (
              <div key={question.question_id} className="card">
                <h3 style={{ margin: "0 0 4px" }}>{question.question_text}</h3>
                <p style={{ margin: "0 0 12px", color: "var(--text-light)", fontSize: "13px" }}>
                  Type : <strong>{question.question_type}</strong> &nbsp;|&nbsp; Réponses :{" "}
                  <strong>{question.total_answers}</strong>
                </p>
                <QuestionChart question={question} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default AnalysisPage;
