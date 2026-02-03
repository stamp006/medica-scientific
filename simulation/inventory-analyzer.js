const config = require('./config');

/**
 * ฟังก์ชันวิเคราะห์และคำนวณจุดสั่งซื้อ (ROP) และปริมาณการสั่ง (EOQ)
 */
function analyzeInventoryOptimization(cfg) {
    const { inventory, standardLine, capabilities } = cfg;

    console.log("=".repeat(60));
    console.log("🔍 INVENTORY STRATEGY ANALYZER (Medica / Processim)");
    console.log("=".repeat(60));

    // --- 1. คำนวณความต้องการใช้ Inventory ต่อวัน (Daily Demand) ---
    
    // ก. คำนวณตามกำลังการผลิตสูงสุดของ Station 1 (Capacity-based)
    const st1DailyCapacity = capabilities.st1Machines * capabilities.st1BaseCap;
    const inventoryConsumptionByCapacity = st1DailyCapacity * standardLine.partsPerUnit;

    // ข. คำนวณตามออเดอร์ที่ลูกค้าสั่ง (Demand-based)
    const ordersPerDay = standardLine.orderAmount / standardLine.orderFrequency;
    const inventoryConsumptionByDemand = ordersPerDay * standardLine.partsPerUnit;

    // ค. เลือกใช้ค่าที่ต่ำกว่า (เพราะผลิตได้ไม่เกินเครื่องจักร และไม่ผลิตเกินออเดอร์)
    const actualDailyDemand = Math.min(inventoryConsumptionByCapacity, inventoryConsumptionByDemand);

    console.log(`📈 Daily Consumption:   ${actualDailyDemand.toFixed(2)} parts/day`);
    console.log(`   (Based on ${st1DailyCapacity.toFixed(1)} units production capacity)`);
    console.log("-".repeat(60));

    // --- 2. คำนวณ Reorder Point (ROP) ---
    // ROP = (Demand * LeadTime) + Safety Stock
    // เราเผื่อ Safety Stock ไว้ 1 วันของการใช้งาน
    const leadTimeUsage = actualDailyDemand * inventory.leadTime;
    const safetyStock = actualDailyDemand * 1; // เผื่อไว้ 1 วัน
    const calculatedROP = leadTimeUsage + safetyStock;

    // --- 3. คำนวณ Economic Order Quantity (EOQ) ---
    // สูตร: sqrt( (2 * Demand * OrderFee) / HoldingCost )
    const calculatedEOQ = Math.sqrt((2 * actualDailyDemand * inventory.orderFee) / inventory.holdingCost);

    // --- 4. แสดงผลการวิเคราะห์ ---
    console.log(`📍 REORDER POINT (ROP) Analysis:`);
    console.log(`   Current Config:      ${inventory.reorderPoint} units`);
    console.log(`   Calculated Ideal:    ${calculatedROP.toFixed(0)} units`);
    console.log(`   💡 Recommendation:   ควรตั้ง ROP ประมาณ ${Math.ceil(calculatedROP / 10) * 10}`);
    console.log("");

    console.log(`📦 REORDER QUANTITY (ROQ/EOQ) Analysis:`);
    console.log(`   Current Config:      ${inventory.reorderQty} units`);
    console.log(`   Calculated Ideal:    ${calculatedEOQ.toFixed(0)} units`);
    console.log(`   💡 Recommendation:   ควรสั่งครั้งละประมาณ ${Math.ceil(calculatedEOQ / 50) * 50}`);
    
    console.log("-".repeat(60));

    // --- 5. วิเคราะห์ค่าใช้จ่าย (Holding vs Ordering) ---
    const ordersPer50Days = (actualDailyDemand * 50) / inventory.reorderQty;
    const totalOrderFee = ordersPer50Days * inventory.orderFee;
    const avgHoldingCost = (inventory.reorderQty / 2) * inventory.holdingCost * 50;

    console.log(`💰 Financial Projection (50 Days):`);
    console.log(`   Estimated Order Fees:   $${totalOrderFee.toLocaleString()}`);
    console.log(`   Estimated Holding Cost: $${avgHoldingCost.toLocaleString()}`);
    
    if (totalOrderFee > avgHoldingCost * 1.5) {
        console.log("   ⚠️ Warning: ค่าธรรมเนียมสั่งซื้อสูงเกินไป! ลองเพิ่ม Reorder Qty");
    } else if (avgHoldingCost > totalOrderFee * 1.5) {
        console.log("   ⚠️ Warning: ค่าเก็บรักษาสูงเกินไป! ลองลด Reorder Qty");
    } else {
        console.log("   ✅ สถานะ: การสั่งซื้อมีความสมดุลระหว่างค่าธรรมเนียมและค่าเก็บรักษา");
    }
    console.log("=".repeat(60));
}

// รันการวิเคราะห์
analyzeInventoryOptimization(config);