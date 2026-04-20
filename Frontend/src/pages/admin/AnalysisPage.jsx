import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
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

const DEPT_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac",
];

function getDeptColor(dept, deptList) {
  const idx = deptList.indexOf(dept);
  return idx >= 0 ? DEPT_COLORS[idx % DEPT_COLORS.length] : "#ccc";
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

function Sociogram({ nodes: rawNodes, edges: rawEdges }) {
  const svgRef = useRef(null);

  const departments = [...new Set(rawNodes.map((n) => n.department).filter(Boolean))];

  useEffect(() => {
    if (!svgRef.current || !rawNodes.length) return;

    // Deep copy so d3 doesn't mutate React state
    const nodes = rawNodes.map((n) => ({ ...n }));
    const edges = rawEdges.map((e) => ({ ...e }));

    const width = svgRef.current.parentElement.clientWidth || 800;
    const height = 550;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f8f9fa")
      .style("border-radius", "8px");

    // Arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 24)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "#aaa");

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(edges).id((d) => d.id).distance(130)
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(32));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#bbb")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", (d) => Math.max(1, Math.sqrt(d.weight) * 1.5))
      .attr("marker-end", "url(#arrowhead)");

    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "grab")
      .call(
        d3
          .drag()
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
      .append("circle")
      .attr("r", 18)
      .attr("fill", (d) => getDeptColor(d.department, departments))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5);

    node
      .append("text")
      .text((d) => (d.id.length > 12 ? d.id.substring(0, 12) + "…" : d.id))
      .attr("text-anchor", "middle")
      .attr("dy", 34)
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [rawNodes, rawEdges]);

  return (
    <div>
      {/* Legend */}
      {departments.length > 0 && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
          {departments.map((dept) => (
            <div key={dept} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: getDeptColor(dept, departments),
                }}
              />
              <span style={{ fontSize: "13px" }}>{dept}</span>
            </div>
          ))}
        </div>
      )}
      <p style={{ color: "#888", fontSize: "13px", margin: "0 0 8px" }}>
        Les flèches indiquent qui a choisi qui. Vous pouvez déplacer les nœuds.
      </p>
      <svg ref={svgRef} style={{ width: "100%", display: "block" }} />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await api.get(`/analysis/${id}/`);
        setAnalysis(response.data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'analyse.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  if (loading) return <p style={{ padding: "20px" }}>Chargement de l'analyse...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;
  if (!analysis) return <p style={{ padding: "20px" }}>Aucune analyse trouvée.</p>;

  const hasSociogram = analysis.sociogram?.nodes?.length > 0;
  const hasDeptInteractions = analysis.department_interactions?.length > 0;
  const totalResponses = analysis.questions[0]?.total_answers ?? 0;

  return (
    <div style={{ padding: "20px", maxWidth: "960px" }}>
      <Link to="/admin" style={{ fontSize: "14px" }}>
        ← Retour au dashboard
      </Link>

      <h1 style={{ marginTop: "16px" }}>Analyse : {analysis.title}</h1>

      {/* ── Overview stats ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div style={{ background: "#f0f4ff", padding: "16px 28px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{totalResponses}</div>
          <div style={{ fontSize: "13px", color: "#555" }}>Réponses au total</div>
        </div>
        <div style={{ background: "#f0f4ff", padding: "16px 28px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{analysis.questions.length}</div>
          <div style={{ fontSize: "13px", color: "#555" }}>Questions</div>
        </div>
        <div style={{ background: "#f0f4ff", padding: "16px 28px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{analysis.sociogram?.nodes?.length ?? 0}</div>
          <div style={{ fontSize: "13px", color: "#555" }}>Personnes dans le sociogramme</div>
        </div>
      </div>

      {/* ── Sociogram ── */}
      {hasSociogram ? (
        <div style={{ marginBottom: "40px" }}>
          <h2>Sociogramme</h2>
          <Sociogram
            nodes={analysis.sociogram.nodes}
            edges={analysis.sociogram.edges}
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
          <DepartmentChart interactions={analysis.department_interactions} />
        </div>
      )}

      {/* ── Per-question detail (collapsible) ── */}
      <div style={{ marginBottom: "40px" }}>
        <button
          onClick={() => setDetailOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "10px 18px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
            width: "100%",
            textAlign: "left",
          }}
        >
          <span>{detailOpen ? "▼" : "▶"}</span>
          Détail par question ({analysis.questions.length} questions)
        </button>

        {detailOpen && (
          <div style={{ marginTop: "16px" }}>
            {analysis.questions.map((question) => (
              <div
                key={question.question_id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ margin: "0 0 4px" }}>{question.question_text}</h3>
                <p style={{ margin: "0 0 8px", color: "#666", fontSize: "13px" }}>
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
  );
}

export default AnalysisPage;
