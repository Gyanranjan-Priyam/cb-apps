import type { RoadmapData } from "../../types";

export const dataScienceAnalyticsRoadmap: RoadmapData = {
  id: "data-science-analytics",
  slug: "data-science-analytics",
  title: "Data Science & Analytics",
  description: "Complete, all-in-one guide for Data Scientists & Analytics Engineers. Master Advanced SQL & Window Functions, Polars & Pandas Data Wrangling, Statistical Hypothesis Testing, A/B Experimentation, Snowflake & dbt Data Modeling, Tableau/PowerBI BI Dashboards, and Predictive ML without needing external materials.",
  category: "ai-ml",
  badgeText: "In-Demand",
  iconName: "Binary",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Data Science & Analytics Roadmap" },
    },
    // 1. Advanced SQL for Analytics
    {
      id: "advanced-sql-analytics",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Advanced SQL & Analytical Queries",
        category: "Databases",
        description: `### 📊 Advanced SQL Window Functions & Aggregations

SQL is the fundamental query language for transforming raw events into actionable business metrics.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-window-functions",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Window Functions: ROW_NUMBER, RANK, LEAD, LAG",
        colorKey: "C",
        description: `### 📈 SQL Window Functions in Action

Calculate rolling averages and period-over-period growth rates.

\`\`\`sql
-- Calculate 7-day rolling active user average and day-over-day revenue delta
SELECT
  activity_date,
  daily_revenue,
  -- 1. 7-Day Moving Average Revenue
  AVG(daily_revenue) OVER (
    ORDER BY activity_date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS rolling_7d_avg,
  -- 2. Previous Day Revenue via LAG
  LAG(daily_revenue, 1) OVER (ORDER BY activity_date) AS prev_day_revenue,
  -- 3. Day-over-Day Growth %
  ROUND(
    ((daily_revenue - LAG(daily_revenue, 1) OVER (ORDER BY activity_date)) 
    / NULLIF(LAG(daily_revenue, 1) OVER (ORDER BY activity_date), 0)) * 100, 2
  ) AS dod_growth_pct
FROM daily_metrics;
\`\`\`
`,
      },
    },
    {
      id: "sub-ctes-pivots",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "CTEs, Subqueries & Pivot Tables",
        colorKey: "C",
        description: `### 📑 Retention Cohort Analysis with Common Table Expressions

\`\`\`sql
WITH user_cohorts AS (
  -- First signup month per user
  SELECT user_id, DATE_TRUNC('month', created_at) AS cohort_month
  FROM users
),
user_activities AS (
  -- Active months per user
  SELECT DISTINCT user_id, DATE_TRUNC('month', activity_date) AS active_month
  FROM user_events
)
SELECT
  c.cohort_month,
  -- Calculate month index offset (0, 1, 2, 3...)
  ROUND((EXTRACT(YEAR FROM a.active_month) - EXTRACT(YEAR FROM c.cohort_month)) * 12 +
        (EXTRACT(MONTH FROM a.active_month) - EXTRACT(MONTH FROM c.cohort_month))) AS month_number,
  COUNT(DISTINCT a.user_id) AS active_users
FROM user_cohorts c
JOIN user_activities a ON c.user_id = a.user_id
GROUP BY 1, 2
ORDER BY 1, 2;
\`\`\`
`,
      },
    },

    // 2. Python & Exploratory Data Analysis
    {
      id: "python-eda-analytics",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Python for Data Analysis (Pandas & Polars)",
        category: "Data Wrangling",
        description: `### ⚡ High-Speed Data Wrangling with Polars & Pandas

Manipulate millions of rows in sub-second execution times using Polars lazy execution.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-polars-pandas",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Polars & Pandas for Fast Tabular Processing",
        colorKey: "C",
        description: `### 🦀 Rust-Powered Polars Lazy Execution

\`\`\`python
import polars as pl

# Lazy query execution plans optimize projections & filters before reading disk!
query = (
    pl.scan_parquet("global_telemetry.parquet")
    .filter(pl.col("country") == "IN")
    .group_by("device_type")
    .agg([
        pl.col("latency_ms").mean().alias("avg_latency"),
        pl.col("latency_ms").quantile(0.95).alias("p95_latency"),
        pl.len().alias("total_requests")
    ])
    .sort("total_requests", descending=True)
)

# Collect and execute query multithreaded across all CPU cores
result_df = query.collect()
print(result_df)
\`\`\`
`,
      },
    },
    {
      id: "sub-data-visualization",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Data Storytelling: Seaborn, Plotly & Altair",
        colorKey: "C",
        description: `### 📈 Visual Storytelling & Interactive Dashboards

Communicate insights with interactive Plotly visual charts.

\`\`\`python
import plotly.express as px

# Create interactive scatter plot with hover metrics
fig = px.scatter(
    df,
    x="monthly_active_hours",
    y="retention_score",
    size="tasks_completed",
    color="branch",
    hover_name="student_name",
    log_x=True,
    title="Student Engagement vs Retention Score"
)
fig.show()
\`\`\`
`,
      },
    },

    // 3. Statistics & Experimentation (A/B Testing)
    {
      id: "statistics-ab-testing",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Applied Statistics & A/B Testing",
        category: "Statistics",
        description: `### 🔬 Hypothesis Testing, Statistical Power & Causal Inference

Design bulletproof A/B tests and calculate sample size requirements.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 22,
      },
    },
    {
      id: "sub-hypothesis-testing",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Hypothesis Testing: T-Test, ANOVA, Chi-Square",
        colorKey: "C",
        description: `### 🧪 Two-Sample T-Test in Python

\`\`\`python
from scipy import stats

control_conversions = [1, 0, 1, 1, 0, 1, 0, 0, 1, 0] * 50
variant_conversions = [1, 1, 1, 0, 1, 1, 0, 1, 1, 0] * 50

# Two-sample independent t-test (Welch's t-test)
t_stat, p_value = stats.ttest_ind(variant_conversions, control_conversions, equal_var=False)

print(f"P-Value: {p_value:.4f}")
if p_value < 0.05:
    print("Statistically Significant improvement (reject null hypothesis H0)!")
\`\`\`
`,
      },
    },
    {
      id: "sub-ab-experimentation",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "A/B Testing Frameworks & Sample Size Calculation",
        colorKey: "C",
        description: `### 📐 Sample Size Determination Formula

$$n = \\frac{2 \\left( Z_{\\alpha/2} + Z_{\\beta} \\right)^2 \\cdot p(1 - p)}{\\delta^2}$$

- $\\alpha = 0.05 \\implies Z_{\\alpha/2} = 1.96$ (95% confidence).
- $1 - \\beta = 0.80 \\implies Z_{\\beta} = 0.84$ (80% statistical power).
- $\\delta$: Minimum Detectable Effect (MDE).
- Avoid the **Peeking Problem**: Never evaluate p-values continuously without sample correction (use Sequential Testing / Alpha spending function).
`,
      },
    },

    // 4. Data Warehousing & Modern Data Stack
    {
      id: "data-warehousing-dbt",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Data Warehousing (Snowflake, BigQuery & dbt)",
        category: "Data Engineering",
        description: `### 🏢 Snowflake Architecture, Star Schemas & dbt SQL Transformations

Model clean dimensional marts with version-controlled dbt pipelines.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-dimensional-modeling",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Dimensional Modeling: Facts & Dimensions",
        colorKey: "C",
        description: `### ⭐ Kimball Star Schema Modeling

- **Fact Tables** (\`fact_quiz_attempts\`): Quantitative metrics, foreign keys to dimensions.
- **Dimension Tables** (\`dim_student\`, \`dim_course\`): Descriptive attributes with surrogate keys.
- **SCD Type 2**: Maintain full historical state changes using \`valid_from\` and \`valid_to\` timestamp columns.
`,
      },
    },
    {
      id: "sub-dbt-analytics-engineering",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "dbt (Data Build Tool) & Data Testing",
        colorKey: "C",
        description: `### 🛠️ dbt Transformation Model Example

\`\`\`sql
-- models/marts/fct_daily_club_points.sql
{{ config(materialized='incremental', unique_key='date_user_key') }}

WITH raw_events AS (
    SELECT * FROM {{ ref('stg_event_participations') }}
    {% if is_incremental() %}
      WHERE event_date >= (SELECT MAX(event_date) FROM {{ this }})
    {% endif %}
)

SELECT
    CONCAT(event_date, '_', user_id) AS date_user_key,
    user_id,
    event_date,
    SUM(points_awarded) AS total_points_earned
FROM raw_events
GROUP BY 1, 2, 3
\`\`\`
`,
      },
    },

    // 5. Business Intelligence & Dashboards
    {
      id: "bi-dashboards",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Business Intelligence (Tableau, PowerBI & Looker)",
        category: "BI & Reporting",
        description: `### 📊 Executive BI Dashboards & Funnel Analytics

Transform data warehouse marts into self-service interactive visual reports.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-bi-kpis",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Executive KPI Metrics & Cohort Analysis",
        colorKey: "C",
        description: `### 📈 SaaS & Club Performance Metrics

- **DAU / MAU Ratio**: Measures product stickiness (target $> 20\\%$).
- **CAC (Customer Acquisition Cost)** vs **LTV (Lifetime Value)** (target $\\text{LTV} \\ge 3 \\times \\text{CAC}$).
- **Net Churn Rate**: $\\frac{\\text{Lost MRR} - \\text{Expansion MRR}}{\\text{Starting MRR}} \\times 100$.
`,
      },
    },
    {
      id: "sub-dashboard-design",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Dashboard UX & Drill-Down Reporting",
        colorKey: "C",
        description: `### 📐 Dashboard Hierarchy & Best Practices

- Top level: Big Numbers (KPI Cards showing Current Value + % Delta vs Target).
- Middle level: Trend charts (Time series line charts & breakdown bars).
- Bottom level: Granular interactive drill-down tables with search filters.
`,
      },
    },

    // 6. Predictive Modeling & Machine Learning
    {
      id: "predictive-analytics-ml",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Predictive Modeling & Feature Engineering",
        category: "Data Science",
        description: `### 🔮 Churn Prediction, Time-Series Forecasting & Customer Segmentation

Apply machine learning to solve concrete business challenges.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-churn-propensity",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Customer Churn & Propensity Scoring (XGBoost)",
        colorKey: "C",
        description: `### 🎯 Explainable Predictions with SHAP Values

\`\`\`python
import shap

# Compute SHAP (Shapley Additive exPlanations) values
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Plot feature importance impact on individual customer churn prediction
shap.summary_plot(shap_values, X_test)
\`\`\`
`,
      },
    },
    {
      id: "sub-time-series-forecasting",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Time Series Forecasting: Prophet, ARIMA & NeuralProphet",
        colorKey: "C",
        description: `### 📅 Seasonal Revenue Forecasting with Prophet

\`\`\`python
from prophet import Prophet

# Prepare DataFrame with 'ds' (datestamp) and 'y' (value)
df_prophet = df.rename(columns={"date": "ds", "daily_revenue": "y"})

m = Prophet(yearly_seasonality=True, weekly_seasonality=True, changepoint_prior_scale=0.05)
m.fit(df_prophet)

future = m.make_future_dataframe(periods=90) # Forecast next 90 days
forecast = m.predict(future)
fig = m.plot(forecast)
\`\`\`
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-data-scientist",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Data Scientist & Analytics Lead",
        category: "Milestone",
        description: `### 🎓 Data Science & Analytics Mastery Attained!

Congratulations! You have mastered data analytics and predictive modeling:
- Expert-level SQL queries, window analytics, and cohort transformations.
- Data wrangling and fast processing with Python, Pandas, and Polars.
- Rigorous statistical hypothesis testing and A/B experimentation design.
- Modern data stack: Snowflake/BigQuery, Star Schema dimensional modeling, and dbt.
- Executive BI reporting (Tableau/PowerBI) and ML predictive modeling (XGBoost/SHAP).
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-ds-1", source: "advanced-sql-analytics", target: "python-eda-analytics", type: "interactive" },
    { id: "e-ds-2", source: "python-eda-analytics", target: "statistics-ab-testing", type: "interactive" },
    { id: "e-ds-3", source: "statistics-ab-testing", target: "data-warehousing-dbt", type: "interactive" },
    { id: "e-ds-4", source: "data-warehousing-dbt", target: "bi-dashboards", type: "interactive" },
    { id: "e-ds-5", source: "bi-dashboards", target: "predictive-analytics-ml", type: "interactive" },
    { id: "e-ds-6", source: "predictive-analytics-ml", target: "milestone-data-scientist", type: "interactive" },

    // Subtopics
    { id: "e-ds-sub-1", source: "advanced-sql-analytics", target: "sub-window-functions" },
    { id: "e-ds-sub-2", source: "advanced-sql-analytics", target: "sub-ctes-pivots" },

    { id: "e-ds-sub-3", source: "python-eda-analytics", target: "sub-polars-pandas" },
    { id: "e-ds-sub-4", source: "python-eda-analytics", target: "sub-data-visualization" },

    { id: "e-ds-sub-5", source: "statistics-ab-testing", target: "sub-hypothesis-testing" },
    { id: "e-ds-sub-6", source: "statistics-ab-testing", target: "sub-ab-experimentation" },

    { id: "e-ds-sub-7", source: "data-warehousing-dbt", target: "sub-dimensional-modeling" },
    { id: "e-ds-sub-8", source: "data-warehousing-dbt", target: "sub-dbt-analytics-engineering" },

    { id: "e-ds-sub-9", source: "bi-dashboards", target: "sub-bi-kpis" },
    { id: "e-ds-sub-10", source: "bi-dashboards", target: "sub-dashboard-design" },

    { id: "e-ds-sub-11", source: "predictive-analytics-ml", target: "sub-churn-propensity" },
    { id: "e-ds-sub-12", source: "predictive-analytics-ml", target: "sub-time-series-forecasting" },
  ],
};
