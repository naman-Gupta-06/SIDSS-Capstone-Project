package com.civil.sidss;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

@SpringBootApplication
public class SidssApplication {
    public static void main(String[] args) {
        SpringApplication.run(SidssApplication.class, args);
    }
}

// ==========================================
// 1. DOMAIN MODELS (DTOs & Entities)
// ==========================================

@Data
@NoArgsConstructor
@AllArgsConstructor
class ProjectRequest {
    private String name;
    private String projectType; // BUILDING, BRIDGE, ROAD
    private int designLifeYears;
    private int constructionDurationMonths;
    private List<MaterialInput> boq; // Bill of Quantities
    private MaintenanceParams maintenance;
    private EconomicParams economics;
    private SocialParams social;
    private PolicyParams policy;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class MaterialInput {
    private String name;
    private double quantity;
    private double unitCost; // $ per unit
    private double carbonFactor; // kgCO2e per unit
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class MaintenanceParams {
    private double annualMaintenanceCost;
    private double degradationRate; // e.g., 0.02 for 2% per year
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class EconomicParams {
    private double discountRate; // e.g., 0.05 for 5%
    private double annualEconomicBenefit; // Tolls, rent, or social value monetized
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class SocialParams {
    private int jobsCreated;
    private int populationServed;
    private double safetyScore; // 1-10
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class PolicyParams {
    private double subsidyRate; // % of construction cost covered by gov
    private double carbonTaxRate; // $ per ton of CO2
    private double approvalThreshold; // Score out of 100 needed
}

@Data
@AllArgsConstructor
class EvaluationResult {
    private String projectName;
    private EngineeringMetrics engineering;
    private FinancialMetrics financial;
    private EnvironmentalMetrics environmental;
    private SocialMetrics social;
    private double finalSustainabilityScore;
    private String approvalStatus; // APPROVED / REJECTED
    private List<String> decisionLog;
}

@Data
@AllArgsConstructor
class EngineeringMetrics {
    private double totalConstructionCost;
    private double totalMaterialMass;
}

@Data
@AllArgsConstructor
class FinancialMetrics {
    private double npv;
    private double irr;
    private double paybackPeriod;
    private double lifeCycleCost;
    private double financialScore; // Normalized 0-100
}

@Data
@AllArgsConstructor
class EnvironmentalMetrics {
    private double materialCarbon;
    private double operationalCarbon; // Simplified for this scope
    private double totalCarbonTons;
    private double environmentalScore; // Normalized 0-100
}

@Data
@AllArgsConstructor
class SocialMetrics {
    private double socialScore; // Normalized 0-100
}

// ==========================================
// 2. CORE SERVICES
// ==========================================

@Service
class EngineeringService {
    public EngineeringMetrics calculateMetrics(List<MaterialInput> boq) {
        double totalCost = boq.stream().mapToDouble(m -> m.getQuantity() * m.getUnitCost()).sum();
        double totalMass = boq.stream().mapToDouble(MaterialInput::getQuantity).sum();
        return new EngineeringMetrics(totalCost, totalMass);
    }
}

@Service
class EnvironmentalService {
    // Reference value for normalization (e.g., a "bad" project has 10,000 tons)
    private static final double MAX_CARBON_REFERENCE = 50000.0;

    public EnvironmentalMetrics calculateImpact(List<MaterialInput> boq, int designLife) {
        // Embodied Carbon
        double materialCarbonKg = boq.stream()
            .mapToDouble(m -> m.getQuantity() * m.getCarbonFactor())
            .sum();

        double materialCarbonTons = materialCarbonKg / 1000.0;

        // Operational Carbon (Simplified estimation based on 10% of embodied per year)
        // In a real civil eng app, this would depend on HVAC, Lighting, or Traffic Load
        double annualOperationalCarbonTons = materialCarbonTons * 0.02;
        double totalOperationalCarbon = annualOperationalCarbonTons * designLife;

        double totalCarbon = materialCarbonTons + totalOperationalCarbon;

        // Score: 100 is Zero Carbon, 0 is Max Reference
        double score = Math.max(0, 100 - (totalCarbon / MAX_CARBON_REFERENCE * 100));

        return new EnvironmentalMetrics(materialCarbonKg, totalOperationalCarbon, totalCarbon, score);
    }
}

@Service
class FinancialService {

    public FinancialMetrics analyze(double constructionCost, MaintenanceParams maint, EconomicParams eco, int years, PolicyParams policy) {
        double discountRate = eco.getDiscountRate();

        // Apply subsidy
        double initialInvestment = constructionCost * (1 - (policy.getSubsidyRate() / 100.0));

        // Cash Flow generation
        double[] cashFlows = new double[years + 1];
        cashFlows[0] = -initialInvestment;

        double totalMaintenance = 0;

        for (int t = 1; t <= years; t++) {
            // Maintenance cost increases due to degradation
            double currentMaintenance = maint.getAnnualMaintenanceCost() * Math.pow(1 + maint.getDegradationRate(), t);
            totalMaintenance += currentMaintenance;

            double netCashFlow = eco.getAnnualEconomicBenefit() - currentMaintenance;

            // Apply Carbon Tax (Operating Expense)
            // Simplified: Assuming a fixed carbon cost per year for calculation
            double annualCarbonTax = 100 * policy.getCarbonTaxRate(); // Dummy volume

            cashFlows[t] = netCashFlow - annualCarbonTax;
        }

        // NPV Calculation
        double npv = 0;
        for (int t = 0; t <= years; t++) {
            npv += cashFlows[t] / Math.pow(1 + discountRate, t);
        }

        // IRR Calculation (Newton's approximation)
        double irr = calculateIRR(cashFlows);

        // Life Cycle Cost (LCC)
        double lcc = constructionCost + totalMaintenance;

        // Financial Score (0-100)
        // Logic: NPV > 0 is good (50+), High IRR is good.
        // We map NPV from range [-Cost, +Cost] to [0, 100] approximately
        double npvRatio = npv / initialInvestment;
        double score = 50 + (npvRatio * 25); // Baseline 50, scales with profitability
        score = Math.min(100, Math.max(0, score));

        return new FinancialMetrics(npv, irr * 100, 0, lcc, score);
    }

    private double calculateIRR(double[] cashFlows) {
        double rate = 0.1; // Initial guess 10%
        for (int i = 0; i < 20; i++) { // 20 Iterations
            double npv = 0;
            double d_npv = 0;
            for (int t = 0; t < cashFlows.length; t++) {
                npv += cashFlows[t] / Math.pow(1 + rate, t);
                d_npv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
            }
            if (Math.abs(d_npv) < 1e-6) break;
            double newRate = rate - npv / d_npv;
            if (Math.abs(newRate - rate) < 1e-6) return newRate;
            rate = newRate;
        }
        return rate;
    }
}

@Service
class SocialService {
    public SocialMetrics evaluate(SocialParams params) {
        // Normalization Factors (Based on regional averages)
        double jobsNorm = Math.min(params.getJobsCreated() / 500.0, 1.0); // Max 500 jobs = 1.0
        double popNorm = Math.min(params.getPopulationServed() / 10000.0, 1.0); // Max 10k people = 1.0
        double safetyNorm = params.getSafetyScore() / 10.0;

        double score = (jobsNorm * 40) + (popNorm * 40) + (safetyNorm * 20);
        return new SocialMetrics(score);
    }
}

@Service
@AllArgsConstructor
class EvaluationService {
    private final EngineeringService engineeringService;
    private final FinancialService financialService;
    private final EnvironmentalService environmentalService;
    private final SocialService socialService;

    public EvaluationResult evaluateProject(ProjectRequest req) {
        // 1. Engineering
        EngineeringMetrics eng = engineeringService.calculateMetrics(req.getBoq());

        // 2. Environmental
        EnvironmentalMetrics env = environmentalService.calculateImpact(req.getBoq(), req.getDesignLifeYears());

        // 3. Financial
        FinancialMetrics fin = financialService.analyze(
                eng.getTotalConstructionCost(),
                req.getMaintenance(),
                req.getEconomics(),
                req.getDesignLifeYears(),
                req.getPolicy()
        );

        // 4. Social
        SocialMetrics soc = socialService.evaluate(req.getSocial());

        // 5. Government Policy / Final Scoring
        // Formula: 0.4 Fin + 0.3 Env + 0.2 Soc + 0.1 Eng (Efficiency)

        // Engineering Score (Efficiency): Lower cost per year is better
        double costPerYear = fin.getLifeCycleCost() / req.getDesignLifeYears();
        double engScore = Math.max(0, 100 - (costPerYear / 10000)); // Dummy normalization

        double finalScore = (fin.getFinancialScore() * 0.4) +
                            (env.getEnvironmentalScore() * 0.3) +
                            (soc.getSocialScore() * 0.2) +
                            (engScore * 0.1);

        String status = finalScore >= req.getPolicy().getApprovalThreshold() ? "APPROVED" : "REJECTED";

        List<String> log = new ArrayList<>();
        log.add("Engineering Cost Calculated: $" + String.format("%.2f", eng.getTotalConstructionCost()));
        log.add("Total Carbon Emission: " + String.format("%.2f", env.getTotalCarbonTons()) + " tons");
        log.add("Financial NPV: $" + String.format("%.2f", fin.getNpv()));
        log.add("Weighted Score Calculated: " + String.format("%.2f", finalScore));

        return new EvaluationResult(req.getName(), eng, fin, env, soc, finalScore, status, log);
    }
}

// ==========================================
// 3. CONTROLLER
// ==========================================

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*") // Allow React Frontend
@AllArgsConstructor
class ProjectController {

    private final EvaluationService evaluationService;

    @PostMapping("/evaluate")
    public ResponseEntity<EvaluationResult> evaluate(@RequestBody ProjectRequest request) {
        return ResponseEntity.ok(evaluationService.evaluateProject(request));
    }

    @GetMapping("/ping")
    public String ping() {
        return "SIDSS Backend Online";
    }
}
