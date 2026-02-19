SIDSS: Sustainable Infrastructure Decision Support System

Author: Naman Gupta, Moiz Zakir.
Domain: Civil Engineering & Sustainable Finance
Date: February 2025

1. Abstract

The construction industry accounts for nearly 40% of global carbon emissions. Traditional infrastructure decision-making relies heavily on immediate financial costs (CAPEX), often neglecting long-term environmental degradation and social utility. SIDSS (Sustainable Infrastructure Decision Support System) is a full-stack engineering platform designed to bridge this gap. By integrating quantity surveying (BOQ), Life Cycle Costing (LCC), and carbon footprint analysis into a unified scoring algorithm, SIDSS provides stakeholders with a holistic "Go/No-Go" evaluation mechanism for civil projects.

3. Problem Statement

Civil engineers currently lack integrated tools to assess sustainability during the feasibility stage.

Financial tools ignore carbon taxes and social benefits.

Environmental tools (LCA) are disconnected from financial budgets.

Government approval is often subjective rather than data-driven.

3. System Architecture

SIDSS operates on a client-server architecture:

Frontend: React.js acts as the Engineer's Dashboard for BOQ entry and visualization.

Backend: Java Spring Boot handles the complex MCDA (Multi-Criteria Decision Analysis) logic.

Data Model: Rigid typing of Material properties, Economic parameters, and Policy constraints.

Core Modules

A. Engineering Module

Responsible for the physical reality of the project.

Input: Bill of Quantities (BOQ).

Output: Total Construction Cost, Mass.

Logic: $Cost = \sum (Quantity_i \times UnitCost_i)$

B. Financial Module (Sustainable Finance)

Moves beyond simple cost to Life Cycle Value.

NPV (Net Present Value): Discounts future cash flows (tolls, social value) against maintenance and degradation.

IRR (Internal Rate of Return): Solved numerically using Newton's method.

LCC (Life Cycle Cost): $LCC = CAPEX + \sum OPEX$

C. Environmental Module

Quantifies the "Green" impact.

Embodied Carbon: Derived from material mass $\times$ carbon factors (e.g., Concrete ~240kg CO2/m³).

Operational Carbon: Estimated energy usage over the Design Life.

Scoring: Normalized inversely (Less carbon = Higher score).

D. Government/Decision Module

The final arbiter of project viability using Weighted Sum Model (WSM).


$$Score_{final} = 0.4(S_{fin}) + 0.3(S_{env}) + 0.2(S_{soc}) + 0.1(S_{eng})$$

4. Conclusion

SIDSS demonstrates that sustainability is not just a qualitative buzzword but a computable engineering metric. By formalizing the trade-offs between cost, carbon, and social benefit, this system empowers governments to approve infrastructure that is financially viable and environmentally responsible.


## 🚀 How to Run SIDSS Locally

If you want to test or evaluate the SIDSS platform on your own machine, follow these steps.

### Prerequisites
Make sure you have the following installed on your computer:
* **Java 17 or higher** (Verify with `java -version`)
* **Maven** (Verify with `mvn -version`)
* **Node.js & npm** (Verify with `node -v` and `npm -v`)

### Step 1: Clone the Repository
Open your terminal and clone this project to your local machine:
```bash
git clone [https://github.com/YOUR_USERNAME/SIDSS-Capstone-Project.git](https://github.com/YOUR_USERNAME/SIDSS-Capstone-Project.git)
cd SIDSS-Capstone-Project

Step 2: Start the Java Backend
The backend runs on Spring Boot and processes the multi-criteria algorithms.
Open a terminal and run:
Bash

cd sidss-backend
mvn spring-boot:run

Wait until you see the "Started SidssApplication" message. The server will run on http://localhost:8080.


Step 3: Start the React Frontend
Open a new, separate terminal window (keep the backend running) and start the frontend dashboard.
Bash

cd sidss-frontend
npm install
npm run dev

Step 4: Use the Application

    Open your web browser and go to the link provided by Vite (usually http://localhost:5173).

    Enter your project materials, costs, and policy parameters in the Input Dashboard.

    Click "RUN EVALUATION" to see the system calculate the NPV, Carbon Footprint, and Final Sustainability Score!
