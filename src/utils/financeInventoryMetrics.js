/**
 * Calculate key metrics from finance and inventory data
 */
export function calculateFinanceInventoryMetrics(financeData, inventoryData) {
    if (!financeData || !inventoryData || financeData.length === 0 || inventoryData.length === 0) {
        return null;
    }

    // Prepare time series data
    const days = [];
    const cashOnHand = [];
    const inventoryLevel = [];
    const inventoryCosts = [];
    const orderingCosts = [];
    const salaries = [];
    const commissionInterest = [];
    const salesStandard = [];
    const salesCustom = [];
    const dispatches = [];

    // Combine data by day
    const maxDays = Math.max(financeData.length, inventoryData.length);

    for (let i = 0; i < maxDays; i++) {
        const finance = financeData[i];
        const inventory = inventoryData[i];

        if (finance || inventory) {
            const day = finance?.day ?? inventory?.day ?? i;
            days.push(day);

            // Finance metrics
            if (finance?.metrics) {
                cashOnHand.push(finance.metrics.finance_cash_on_hand ?? null);
                inventoryCosts.push(finance.metrics["finance_inventory_costs_*to_date"] ?? null);
                orderingCosts.push(finance.metrics["finance_standard_ordering_costs_*to_date"] ?? null);
                salaries.push(finance.metrics["finance_salaries_*to_date"] ?? null);

                // Combine interest earned and commission (if exists)
                const interest = finance.metrics["finance_interest_earned_*to_date"] ?? 0;
                commissionInterest.push(interest);

                salesStandard.push(finance.metrics["finance_sales_standard_*to_date"] ?? null);
                salesCustom.push(finance.metrics["finance_sales_custom_*to_date"] ?? null);
            } else {
                cashOnHand.push(null);
                inventoryCosts.push(null);
                orderingCosts.push(null);
                salaries.push(null);
                commissionInterest.push(null);
                salesStandard.push(null);
                salesCustom.push(null);
            }

            // Inventory metrics
            if (inventory?.metrics) {
                inventoryLevel.push(inventory.metrics.inventory_level ?? null);
                dispatches.push(inventory.metrics.inventory_dispatches ?? 0);
            } else {
                inventoryLevel.push(null);
                dispatches.push(0);
            }
        }
    }

    // Calculate KPIs
    const stockoutDays = inventoryLevel.filter((level) => level !== null && level <= 0).length;
    const reorderEvents = dispatches.filter((d) => d > 0).length;

    const validInventoryLevels = inventoryLevel.filter((v) => v !== null);
    const avgInventoryLevel = validInventoryLevels.length > 0
        ? validInventoryLevels.reduce((sum, v) => sum + v, 0) / validInventoryLevels.length
        : 0;

    const validCashOnHand = cashOnHand.filter((v) => v !== null);
    const avgCashOnHand = validCashOnHand.length > 0
        ? validCashOnHand.reduce((sum, v) => sum + v, 0) / validCashOnHand.length
        : 0;

    // Get final values for cost efficiency calculation
    const finalInventoryCost = inventoryCosts.filter((v) => v !== null).pop() || 0;
    const finalSalesStandard = salesStandard.filter((v) => v !== null).pop() || 0;
    const finalSalesCustom = salesCustom.filter((v) => v !== null).pop() || 0;
    const totalSales = finalSalesStandard + finalSalesCustom;

    const inventoryCostPerUnitSold = totalSales > 0 ? (finalInventoryCost / totalSales) * 100 : 0;

    return {
        timeSeries: {
            days,
            cashOnHand,
            inventoryLevel,
            inventoryCosts,
            orderingCosts,
            salaries,
            commissionInterest,
            salesStandard,
            salesCustom,
            dispatches,
        },
        kpis: {
            stockoutDays,
            avgInventoryLevel: Math.round(avgInventoryLevel),
            avgCashOnHand: Math.round(avgCashOnHand),
            inventoryCostPerUnitSold: inventoryCostPerUnitSold.toFixed(2),
            reorderEvents,
        },
    };
}

/**
 * Prepare chart data for inventory vs cash chart
 */
export function prepareInventoryCashChart(metrics) {
    if (!metrics) return null;

    const { days, inventoryLevel, cashOnHand, dispatches } = metrics.timeSeries;

    // Find reorder points (where dispatches > 0)
    const reorderPoints = [];
    dispatches.forEach((dispatch, index) => {
        if (dispatch > 0) {
            reorderPoints.push({
                day: days[index],
                inventory: inventoryLevel[index],
                cash: cashOnHand[index],
            });
        }
    });

    return {
        labels: days,
        series: [
            {
                name: "Inventory Level",
                values: inventoryLevel,
                highlight: false,
            },
            {
                name: "Cash On Hand",
                values: cashOnHand,
                highlight: false,
            },
        ],
        reorderPoints, // For marking reorder events
    };
}

/**
 * Prepare chart data for cost accumulation
 */
export function prepareCostAccumulationChart(metrics) {
    if (!metrics) return null;

    const { days, inventoryCosts, orderingCosts, salaries, commissionInterest } = metrics.timeSeries;

    return {
        labels: days,
        series: [
            {
                name: "Inventory Costs",
                values: inventoryCosts,
                highlight: false,
            },
            {
                name: "Ordering Costs",
                values: orderingCosts,
                highlight: false,
            },
            {
                name: "Salaries",
                values: salaries,
                highlight: true,
            },
            {
                name: "Interest Earned",
                values: commissionInterest,
                highlight: false,
            },
        ],
    };
}

/**
 * Prepare chart data for sales performance
 */
export function prepareSalesPerformanceChart(metrics) {
    if (!metrics) return null;

    const { days, salesStandard, salesCustom } = metrics.timeSeries;

    return {
        labels: days,
        series: [
            {
                name: "Sales Standard",
                values: salesStandard,
                highlight: false,
            },
            {
                name: "Sales Custom",
                values: salesCustom,
                highlight: false,
            },
        ],
    };
}
