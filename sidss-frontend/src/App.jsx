import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

// --- STYLES (Tailwind Wrapper) ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-md border border-slate-200 rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, icon }) => (
  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
    <span>{icon}</span> {title}
  </h3>
);

const InputGroup = ({ label, name, value, onChange, type = "number", step = "any" }) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      step={step}
      className="border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

// --- MAIN APPLICATION ---
export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // --- STATE MODELS ---
  const [project, setProject] = useState({
    name: "New Bridge Project Alpha",
    projectType: "BRIDGE",
    designLifeYears: 50,
    constructionDurationMonths: 24,
  });

  const [materials, setMaterials] = useState([
    { id: 1, name: "Concrete (C30/37)", quantity: 5000, unitCost: 120, carbonFactor: 240 },
    { id: 2, name: "Reinforced Steel", quantity: 500, unitCost: 900, carbonFactor: 1850 },
    { id: 3, name: "Asphalt", quantity: 1200, unitCost: 80, carbonFactor: 45 },
  ]);

  const [economics, setEconomics] = useState({
    discountRate: 0.05,
    annualEconomicBenefit: 250000,
    annualMaintenanceCost: 15000,
    degradationRate: 0.02
  });

  const [social, setSocial] = useState({
    jobsCreated: 150,
    populationServed: 5000,
    safetyScore: 8.5
  });

  const [policy, setPolicy] = useState({
    subsidyRate: 10.0,
    carbonTaxRate: 25.0,
    approvalThreshold: 60.0
  });

  // --- HANDLERS (FIXED) ---
  const handleMaterialChange = (id, field, value) => {
    // FIX: Do not parse float here. Just save exactly what the user types.
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addMaterial = () => {
    setMaterials([...materials, { id: Date.now(), name: "", quantity: "", unitCost: "", carbonFactor: "" }]);
  };

  const removeMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const calculate = async () => {
    setLoading(true);

    // Construct Payload matching Java DTO
    const payload = {
      name: project.name,
      projectType: project.projectType,
      designLifeYears: parseInt(project.designLifeYears) || 0,
      constructionDurationMonths: parseInt(project.constructionDurationMonths) || 0,

      // FIX: Safely parse to float here before sending to Java backend
      boq: materials.map(({name, quantity, unitCost, carbonFactor}) => ({
        name: name,
        quantity: parseFloat(quantity) || 0,
        unitCost: parseFloat(unitCost) || 0,
        carbonFactor: parseFloat(carbonFactor) || 0
      })),

      maintenance: {
        annualMaintenanceCost: parseFloat(economics.annualMaintenanceCost) || 0,
        degradationRate: parseFloat(economics.degradationRate) || 0
      },
      economics: {
        discountRate: parseFloat(economics.discountRate) || 0,
        annualEconomicBenefit: parseFloat(economics.annualEconomicBenefit) || 0
      },
      social: {
        jobsCreated: parseInt(social.jobsCreated) || 0,
        populationServed: parseInt(social.populationServed) || 0,
        safetyScore: parseFloat(social.safetyScore) || 0
      },
      policy: {
        subsidyRate: parseFloat(policy.subsidyRate) || 0,
        carbonTaxRate: parseFloat(policy.carbonTaxRate) || 0,
        approvalThreshold: parseFloat(policy.approvalThreshold) || 0
      }
    };

    try {
      const response = await fetch('http://localhost:8080/api/projects/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Calculation Failed");

      const data = await response.json();
      setResults(data);
      setActiveTab('results');
    } catch (error) {
      alert("Error connecting to Backend. Ensure Java app is running on port 8080.\n\n" + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const StatusBadge = ({ status }) => {
    const isApproved = status === "APPROVED";
    return (
      <div className={`px-4 py-2 rounded-full font-bold text-center text-white text-lg ${isApproved ? 'bg-green-600' : 'bg-red-600'}`}>
        {status}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SIDSS</h1>
          <p className="text-sm text-slate-500 font-mono">Sustainable Infrastructure Decision Support System v1.0</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded font-semibold ${activeTab === 'input' ? 'bg-blue-700 text-white' : 'bg-white text-slate-600 border'}`}
          >
            Input Parameters
          </button>
          <button
            onClick={() => results && setActiveTab('results')}
            disabled={!results}
            className={`px-4 py-2 rounded font-semibold ${activeTab === 'results' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-400'}`}
          >
            Analysis Results
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {activeTab === 'input' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* COLUMN 1: Project & BOQ */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <SectionHeader title="Project Definition" icon="🏗️" />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Project Name" value={project.name} onChange={(e) => setProject({...project, name: e.target.value})} type="text" />
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                    <select
                      className="border border-slate-300 rounded p-2 text-sm"
                      value={project.projectType}
                      onChange={(e) => setProject({...project, projectType: e.target.value})}
                    >
                      <option value="BUILDING">Building</option>
                      <option value="BRIDGE">Bridge</option>
                      <option value="ROAD">Road</option>
                    </select>
                  </div>
                  <InputGroup label="Design Life (Years)" value={project.designLifeYears} onChange={(e) => setProject({...project, designLifeYears: e.target.value})} />
                  <InputGroup label="Construction (Months)" value={project.constructionDurationMonths} onChange={(e) => setProject({...project, constructionDurationMonths: e.target.value})} />
                </div>
              </Card>

              <Card>
                <SectionHeader title="Bill of Quantities (BOQ)" icon="🧱" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="p-3">Material</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit Cost ($)</th>
                        <th className="p-3">Carbon (kgCO2e)</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => (
                        <tr key={m.id} className="border-b">
                          <td className="p-2"><input className="w-full border p-1" value={m.name} onChange={(e) => handleMaterialChange(m.id, 'name', e.target.value)} /></td>
                          <td className="p-2"><input type="number" className="w-24 border p-1" value={m.quantity} onChange={(e) => handleMaterialChange(m.id, 'quantity', e.target.value)} /></td>
                          <td className="p-2"><input type="number" className="w-24 border p-1" value={m.unitCost} onChange={(e) => handleMaterialChange(m.id, 'unitCost', e.target.value)} /></td>
                          <td className="p-2"><input type="number" className="w-24 border p-1" value={m.carbonFactor} onChange={(e) => handleMaterialChange(m.id, 'carbonFactor', e.target.value)} /></td>
                          <td className="p-2 text-right">
                            <button onClick={() => removeMaterial(m.id)} className="text-red-500 hover:text-red-700">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addMaterial} className="mt-4 text-sm text-blue-600 font-bold hover:underline">+ Add Material Item</button>
                </div>
              </Card>
            </div>

            {/* COLUMN 2: Parameters */}
            <div className="space-y-6">
              <Card>
                <SectionHeader title="Financial Parameters" icon="💰" />
                <div className="space-y-4">
                  <InputGroup label="Annual Benefit ($)" value={economics.annualEconomicBenefit} onChange={(e) => setEconomics({...economics, annualEconomicBenefit: e.target.value})} />
                  <InputGroup label="Maintenance Cost ($/yr)" value={economics.annualMaintenanceCost} onChange={(e) => setEconomics({...economics, annualMaintenanceCost: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Discount Rate (0-1)" value={economics.discountRate} step="0.01" onChange={(e) => setEconomics({...economics, discountRate: e.target.value})} />
                    <InputGroup label="Degradation Rate" value={economics.degradationRate} step="0.001" onChange={(e) => setEconomics({...economics, degradationRate: e.target.value})} />
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeader title="Social & Policy" icon="⚖️" />
                <div className="space-y-4">
                  <InputGroup label="Jobs Created" value={social.jobsCreated} onChange={(e) => setSocial({...social, jobsCreated: e.target.value})} />
                  <InputGroup label="Population Served" value={social.populationServed} onChange={(e) => setSocial({...social, populationServed: e.target.value})} />
                  <InputGroup label="Safety Score (1-10)" value={social.safetyScore} onChange={(e) => setSocial({...social, safetyScore: e.target.value})} />
                  <hr className="my-2"/>
                  <InputGroup label="Gov Subsidy (%)" value={policy.subsidyRate} onChange={(e) => setPolicy({...policy, subsidyRate: e.target.value})} />
                  <InputGroup label="Carbon Tax ($/Ton)" value={policy.carbonTaxRate} onChange={(e) => setPolicy({...policy, carbonTaxRate: e.target.value})} />
                  <InputGroup label="Approval Threshold" value={policy.approvalThreshold} onChange={(e) => setPolicy({...policy, approvalThreshold: e.target.value})} />
                </div>
              </Card>

              <button
                onClick={calculate}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 shadow-lg transition-all"
              >
                {loading ? "Simulating..." : "RUN EVALUATION"}
              </button>
            </div>
          </div>
        ) : (
          /* RESULTS TAB */
          <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Evaluation Report: {results.projectName}</h2>
                <StatusBadge status={results.approvalStatus} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="text-center">
                   <div className="text-xs text-slate-500 uppercase">Final Sustainability Score</div>
                   <div className="text-4xl font-extrabold text-blue-600 mt-2">{results.finalSustainabilityScore.toFixed(1)}</div>
                   <div className="text-xs text-slate-400 mt-1">/ 100</div>
                </Card>
                <Card className="text-center">
                   <div className="text-xs text-slate-500 uppercase">NPV</div>
                   <div className={`text-2xl font-bold mt-2 ${results.financial.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     ${results.financial.npv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                   </div>
                </Card>
                <Card className="text-center">
                   <div className="text-xs text-slate-500 uppercase">IRR</div>
                   <div className="text-2xl font-bold text-slate-700 mt-2">{results.financial.irr.toFixed(2)}%</div>
                </Card>
                <Card className="text-center">
                   <div className="text-xs text-slate-500 uppercase">Carbon Footprint</div>
                   <div className="text-2xl font-bold text-slate-700 mt-2">{results.environmental.totalCarbonTons.toFixed(0)} <span className="text-sm">tons</span></div>
                </Card>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <SectionHeader title="Multi-Criteria Score Breakdown" icon="📊" />
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Financial', score: results.financial.financialScore, fill: '#3b82f6' },
                        { name: 'Environmental', score: results.environmental.environmentalScore, fill: '#10b981' },
                        { name: 'Social', score: results.social.socialScore, fill: '#f59e0b' },
                      ]} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={100}/>
                        <Tooltip />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {
                                [
                                    { name: 'Financial', fill: '#3b82f6' },
                                    { name: 'Environmental', fill: '#10b981' },
                                    { name: 'Social', fill: '#f59e0b' },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))
                            }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Decision Log" icon="📋" />
                  <ul className="text-sm space-y-2 font-mono text-slate-600">
                    {results.decisionLog.map((log, i) => (
                      <li key={i} className="border-b border-slate-100 pb-1">
                        <span className="text-blue-500 mr-2">➜</span> {log}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 bg-slate-100 rounded text-xs text-slate-500">
                    <strong>Logic Applied:</strong> The final score is a weighted sum:
                    0.4 × Financial + 0.3 × Environmental + 0.2 × Social + 0.1 × Engineering Efficiency.
                    Approval is granted if Final Score ≥ {policy.approvalThreshold}.
                  </div>
                </Card>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
